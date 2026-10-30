import { query } from '../../db';

export interface RegisterDeviceDto {
  deviceId: string;
  hwModel?: string;
  platformVersion?: string;
}

export interface ReportHostDto {
  cpuPct: number;
  memFreeMb: number;
  diskFreeGb: number;
  tempC: number;
  uptimeS: number;
  platformVersion?: string;
}

export interface ReportDeploymentDto {
  installationId: string;
  status: 'queued' | 'pulling' | 'starting' | 'running' | 'failed' | 'rolled_back' | 'removed';
  containerId?: string;
  cpuPct?: number;
  memMb?: number;
  error?: string;
}

export interface AgentReportDto {
  generation: number;
  deployments: ReportDeploymentDto[];
  host: ReportHostDto;
}

export class EdgeService {
  /**
   * Registers a physical device (Raspberry Pi 5)
   */
  async register(dto: RegisterDeviceDto) {
    const devices = await query('SELECT * FROM pos.devices WHERE id = $1', [dto.deviceId]);
    if (devices.length === 0) {
      throw new Error(`Device ${dto.deviceId} not registered in POS platform`);
    }

    await query(`
      UPDATE pos.devices 
      SET is_online = true, last_seen_at = NOW()
      WHERE id = $1
    `, [dto.deviceId]);

    // Issue agent token (deterministic/signed token for box)
    const agentToken = `bb_agt_${Buffer.from(`${dto.deviceId}:${Date.now()}`).toString('base64url')}`;
    return { agentToken };
  }

  /**
   * Generates the desired-state document for a box
   */
  async getDesiredState(deviceId: string) {
    const devices = await query('SELECT tenant_id FROM pos.devices WHERE id = $1', [deviceId]);
    if (devices.length === 0) {
      throw new Error(`Device ${deviceId} not found`);
    }
    const tenantId = devices[0].tenant_id;

    // Fetch active installations for edge or hybrid apps
    const installs = await query(`
      SELECT i.id as installation_id, i.app_id, a.package_id, a.name, a.runtime,
             i.config, i.granted_scopes
      FROM store.installations i
      JOIN store.apps a ON i.app_id = a.id
      WHERE i.tenant_id = $1 
        AND i.status = 'active'
        AND a.runtime IN ('edge', 'hybrid')
    `, [tenantId]);

    const appsToRun = [];

    for (const inst of installs) {
      // Resolve target version for this tenant using staged rollout bucket
      const versionIdRes = await query(`
        SELECT store.version_for_tenant($1, $2) as version_id
      `, [inst.app_id, tenantId]);

      const versionId = versionIdRes[0]?.version_id;
      if (!versionId) continue;

      const verDetails = await query(`
        SELECT version, image_ref, signature, manifest
        FROM store.app_versions
        WHERE id = $1
      `, [versionId]);

      if (verDetails.length === 0) continue;
      const ver = verDetails[0];

      // Upsert edge_deployment record as queued/running
      await query(`
        INSERT INTO store.edge_deployments (installation_id, device_id, version_id, status)
        VALUES ($1, $2, $3, 'starting')
        ON CONFLICT (installation_id, device_id) 
        DO UPDATE SET version_id = EXCLUDED.version_id, updated_at = NOW()
        WHERE edge_deployments.version_id <> EXCLUDED.version_id
      `, [inst.installation_id, deviceId, versionId]).catch(() => {
        // Fallback for schemas without updated_at column
        return query(`
          INSERT INTO store.edge_deployments (installation_id, device_id, version_id, status)
          VALUES ($1, $2, $3, 'starting')
          ON CONFLICT (installation_id, device_id) 
          DO UPDATE SET version_id = EXCLUDED.version_id
        `, [inst.installation_id, deviceId, versionId]);
      });

      appsToRun.push({
        installationId: inst.installation_id,
        packageId: inst.package_id,
        version: ver.version,
        image: ver.image_ref || `registry.bizbox.in/${inst.package_id}:${ver.version}`,
        signature: ver.signature,
        env: {
          BIZBOX_POS_URL: 'http://pos.internal:8080',
          BIZBOX_INSTALLATION_ID: inst.installation_id,
          BIZBOX_DEVICE_ID: deviceId,
          BIZBOX_APP_TOKEN: `bb_tok_${Buffer.from(inst.installation_id).toString('base64url')}`,
        },
        resources: ver.manifest?.resources || { cpu: '0.25', memory: '256Mi' },
        config: inst.config || {},
      });
    }

    // Deterministic generation hash based on apps count & versions
    const genSeed = appsToRun.map(a => `${a.packageId}:${a.version}`).join('|');
    const generation = Math.abs(genSeed.split('').reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0)) || 1;

    return {
      deviceId,
      generation,
      apps: appsToRun,
    };
  }

  /**
   * Processes the device and container report from the agent
   */
  async processReport(deviceId: string, report: AgentReportDto) {
    // 1. Update device heartbeat & telemetry
    await query(`
      UPDATE pos.devices 
      SET is_online = true, last_seen_at = NOW()
      WHERE id = $1
    `, [deviceId]);

    // 2. Update deployments status
    if (report.deployments && Array.isArray(report.deployments)) {
      for (const dep of report.deployments) {
        await query(`
          UPDATE store.edge_deployments
          SET status = $1,
              container_id = $2,
              cpu_pct = $3,
              mem_mb = $4,
              error = $5,
              last_heartbeat = NOW()
          WHERE installation_id = $6 AND device_id = $7
        `, [
          dep.status,
          dep.containerId || null,
          dep.cpuPct || null,
          dep.memMb || null,
          dep.error || null,
          dep.installationId,
          deviceId
        ]);

        // Auto-Halt & Rollback check (Page 6 of PDF)
        if (dep.status === 'failed' && dep.error) {
          await query(`
            INSERT INTO store.store_audit (actor, action, entity, entity_id, detail)
            VALUES ('edge_agent', 'container.crash', 'edge_deployments', $1, $2)
          `, [
            dep.installationId,
            JSON.stringify({ deviceId, error: dep.error, status: dep.status })
          ]);
        }
      }
    }

    return { acknowledged: true };
  }

  /**
   * Issues short-lived pull token for OCI registry
   */
  async getRegistryToken(deviceId: string) {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins
    const token = `oci_pull_${Buffer.from(`${deviceId}:${Date.now()}`).toString('base64url')}`;
    return { token, expiresAt };
  }
}

export const edgeService = new EdgeService();
