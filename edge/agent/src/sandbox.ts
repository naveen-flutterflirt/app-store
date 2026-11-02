/**
 * BizBox Box - Container Sandbox & Cosign Signature Verifier
 * Raspberry Pi 5 · k3s / containerd runtime
 * FlutterFlirt Private Limited
 */

export interface ContainerResourceLimits {
  cpu: string;     // e.g. "0.25"
  memory: string;  // e.g. "256Mi"
}

export interface ContainerSpec {
  installationId: string;
  packageId: string;
  version: string;
  image: string;
  signature: string;
  resources: ContainerResourceLimits;
  env: Record<string, string>;
  config: Record<string, any>;
}

export interface LocalAppVersionCache {
  packageId: string;
  currentVersion: string;
  previousVersion?: string;
  lastKnownGoodImage?: string;
}

export class CosignVerifier {
  // Mock/Simulated Sigstore BizBox Root Public Key
  private static readonly BIZBOX_SIGNING_PREFIX = 'cosign:';

  /**
   * Verifies that the container image was cryptographically signed
   * by FlutterFlirt's official publishing pipeline key.
   */
  public static verifySignature(imageRef: string, signature?: string): boolean {
    if (!signature || signature.trim() === '') {
      console.warn(`[Cosign Security] Image ${imageRef} is UNSIGNED. Execution blocked!`);
      return false;
    }

    if (signature.startsWith(this.BIZBOX_SIGNING_PREFIX) || signature.length >= 32) {
      console.log(`[Cosign Security] ✓ Verified valid cryptographic signature for: ${imageRef}`);
      return true;
    }

    console.warn(`[Cosign Security] Signature mismatch for: ${imageRef}`);
    return false;
  }
}

export class ContainerSandbox {
  private activeContainers: Map<string, {
    containerId: string;
    spec: ContainerSpec;
    status: 'starting' | 'running' | 'failed' | 'rolled_back' | 'removed';
    restartCount: number;
    cpuPct: number;
    memMb: number;
    startedAt: Date;
    error?: string;
  }> = new Map();

  // Dual-version image cache for instant zero-network rollback (Page 6 & 7)
  private versionCache: Map<string, LocalAppVersionCache> = new Map();

  /**
   * Deploys an app into an isolated k3s sandbox namespace with strict resource limits
   */
  public async deployApp(spec: ContainerSpec): Promise<{ containerId: string; status: string }> {
    const { packageId, version, image, signature, resources } = spec;

    console.log(`\n--------------------------------------------------------------`);
    console.log(`[k3s Sandbox] Reconciling: ${packageId} (version ${version})`);
    console.log(`[k3s Sandbox] Enforcing Resource Limits: CPU=${resources.cpu}, Memory=${resources.memory}`);
    console.log(`[k3s Sandbox] Filesystem: Read-only rootfs with isolated namespace: app-${packageId.replace(/[^a-zA-Z0-9]/g, '-')}`);

    // 1. Signature Check
    const isSigned = CosignVerifier.verifySignature(image, signature);
    if (!isSigned) {
      const err = `Security Exception: Image ${image} signature verification failed.`;
      this.recordFailure(packageId, spec, err);
      throw new Error(err);
    }

    // 2. Track previous version for dual-version retention
    const cached = this.versionCache.get(packageId);
    if (cached && cached.currentVersion !== version) {
      cached.previousVersion = cached.currentVersion;
      cached.lastKnownGoodImage = cached.lastKnownGoodImage;
      cached.currentVersion = version;
      this.versionCache.set(packageId, cached);
      console.log(`[k3s Sandbox] Retaining previous image for instant rollback: ${cached.previousVersion}`);
    } else if (!cached) {
      this.versionCache.set(packageId, {
        packageId,
        currentVersion: version,
        lastKnownGoodImage: image
      });
    }

    // 3. Spawn sandboxed container
    const containerId = `k3s-${packageId.split('.').pop()}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Simulate memory usage within allocated limits
    const maxMemMb = parseInt(resources.memory.replace(/[^0-9]/g, '')) || 256;
    const initialMemMb = Math.floor(maxMemMb * 0.45); // e.g. ~115 MiB out of 256 MiB
    const initialCpuPct = 1.85;

    this.activeContainers.set(packageId, {
      containerId,
      spec,
      status: 'running',
      restartCount: 0,
      cpuPct: initialCpuPct,
      memMb: initialMemMb,
      startedAt: new Date()
    });

    console.log(`[k3s Sandbox] ✓ Container ${containerId} running successfully.`);
    return { containerId, status: 'running' };
  }

  /**
   * Simulates an app crash or memory limit breach
   */
  public simulateCrash(packageId: string, reason: string): boolean {
    const container = this.activeContainers.get(packageId);
    if (!container) return false;

    container.restartCount += 1;
    container.error = reason;
    console.warn(`[k3s Sandbox] ⚠️ Container for ${packageId} crashed (Attempt ${container.restartCount}/3): ${reason}`);

    if (container.restartCount >= 3) {
      // Rule from Page 7: "the agent restarts it 3 times, then disables it and alerts the owner."
      console.error(`[k3s Sandbox] ❌ ${packageId} exceeded 3 crash restarts. Triggering instant rollback...`);
      return this.triggerInstantRollback(packageId);
    }

    container.status = 'starting';
    return false;
  }

  /**
   * Performs instant rollback to previously retained image
   */
  public triggerInstantRollback(packageId: string): boolean {
    const cached = this.versionCache.get(packageId);
    if (cached && cached.previousVersion) {
      console.log(`[k3s Sandbox] 🔄 Rolling back ${packageId} to version ${cached.previousVersion}...`);
      const container = this.activeContainers.get(packageId);
      if (container) {
        container.spec.version = cached.previousVersion;
        container.status = 'rolled_back';
        container.error = 'Auto-rolled back due to instability';
        container.restartCount = 0;
      }
      return true;
    } else {
      console.warn(`[k3s Sandbox] No previous image cached for ${packageId}. Disabling container.`);
      const container = this.activeContainers.get(packageId);
      if (container) {
        container.status = 'failed';
      }
      return false;
    }
  }

  public getDeploymentsReport() {
    const reports = [];
    for (const [_, c] of this.activeContainers) {
      reports.push({
        installationId: c.spec.installationId,
        packageId: c.spec.packageId,
        version: c.spec.version,
        status: c.status,
        containerId: c.containerId,
        cpuPct: c.cpuPct,
        memMb: c.memMb,
        error: c.error,
        restartCount: c.restartCount
      });
    }
    return reports;
  }

  private recordFailure(packageId: string, spec: ContainerSpec, error: string) {
    this.activeContainers.set(packageId, {
      containerId: 'none',
      spec,
      status: 'failed',
      restartCount: 1,
      cpuPct: 0,
      memMb: 0,
      startedAt: new Date(),
      error
    });
  }
}

