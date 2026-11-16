/**
 * Client-side audit proof SVG fallback generator
 * Guarantees crisp visual rendering even if external assets or network are blocked.
 */
export function getFallbackAuditProof(urlOrIdentifier: string): string {
  const lower = (urlOrIdentifier || '').toLowerCase();

  if (lower.includes('pos-terminal-crash') || lower.includes('terminal') || lower.includes('upi') || lower.includes('payment')) {
    const svg = `<svg width="800" height="500" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="500" fill="#0f172a" rx="16"/>
  <rect width="800" height="48" fill="#1e293b" rx="16"/>
  <rect y="36" width="800" height="12" fill="#1e293b"/>
  <circle cx="28" cy="24" r="7" fill="#ef4444"/>
  <circle cx="48" cy="24" r="7" fill="#eab308"/>
  <circle cx="68" cy="24" r="7" fill="#22c55e"/>
  <text x="96" y="29" fill="#94a3b8" font-family="monospace" font-size="13" font-weight="bold">BizBox Edge POS Sandbox – Crash Audit Log</text>
  <rect x="30" y="70" width="740" height="70" fill="#450a0a" rx="8" stroke="#dc2626" stroke-width="1.5"/>
  <text x="50" y="98" fill="#fca5a5" font-family="sans-serif" font-size="16" font-weight="bold">🚨 CRITICAL AUDIT FAILURE: Payment Terminal Hook Crash</text>
  <text x="50" y="122" fill="#fecaca" font-family="monospace" font-size="13">Error Code: ERR_POS_TERMINAL_CALLBACK_DROPPED • Subsystem: libpos_edge_runtime.so.1</text>
  <rect x="30" y="160" width="740" height="300" fill="#020617" rx="8" stroke="#334155" stroke-width="1"/>
  <text x="50" y="195" fill="#38bdf8" font-family="monospace" font-size="13">[09:44:12.108] INFO: Initializing application bundle in isolated edge sandbox cgroup</text>
  <text x="50" y="220" fill="#38bdf8" font-family="monospace" font-size="13">[09:44:12.842] INFO: Hardware target: Raspberry Pi 5 (BCM2712 4x Cortex-A76)</text>
  <text x="50" y="245" fill="#fbbf24" font-family="monospace" font-size="13">[09:44:13.201] WARN: Sandbox memory consumption spike: 184MB / 128MB limit</text>
  <text x="50" y="270" fill="#ef4444" font-family="monospace" font-size="13">[09:44:13.882] FATAL EXCEPTION: ConnectionResetError: Socket disconnected while waiting for UPI QR callback</text>
  <text x="50" y="295" fill="#f87171" font-family="monospace" font-size="13">   at PosPaymentBridge.processTransaction (/app/dist/bundle.js:142:19)</text>
  <text x="50" y="320" fill="#f87171" font-family="monospace" font-size="13">   at WebhookListener.handleTerminalEvent (/app/dist/bundle.js:88:5)</text>
  <text x="50" y="345" fill="#f87171" font-family="monospace" font-size="13">   at async EdgeEventBus.dispatch (/runtime/edge-core.js:312:12)</text>
  <text x="50" y="375" fill="#94a3b8" font-family="monospace" font-size="12">Audit Reason: Payment gateway webhook listener dropped connection after 5000ms timeout</text>
  <text x="50" y="400" fill="#a855f7" font-family="monospace" font-size="12">Cosign SHA-256 Digest: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</text>
  <text x="50" y="430" fill="#22c55e" font-family="monospace" font-size="12">✔ Automated remediation guide: update webhook listener timeout and adjust memory limit.</text>
</svg>`;
    return `data:image/svg+xml;base64,${typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(svg))) : Buffer.from(svg).toString('base64')}`;
  }

  if (lower.includes('sandbox-oom') || lower.includes('oom') || lower.includes('memory')) {
    const svg = `<svg width="800" height="500" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="500" fill="#0f172a" rx="16"/>
  <rect width="800" height="48" fill="#1e293b" rx="16"/>
  <rect y="36" width="800" height="12" fill="#1e293b"/>
  <circle cx="28" cy="24" r="7" fill="#ef4444"/>
  <circle cx="48" cy="24" r="7" fill="#eab308"/>
  <circle cx="68" cy="24" r="7" fill="#22c55e"/>
  <text x="96" y="29" fill="#94a3b8" font-family="monospace" font-size="13" font-weight="bold">BizBox Edge Sandbox – Memory Limit Exceeded (OOM)</text>
  <rect x="30" y="70" width="740" height="70" fill="#450a0a" rx="8" stroke="#dc2626" stroke-width="1.5"/>
  <text x="50" y="98" fill="#fca5a5" font-family="sans-serif" font-size="16" font-weight="bold">🚨 CRITICAL AUDIT FAILURE: Process Killed By Cgroup OOM-Killer</text>
  <text x="50" y="122" fill="#fecaca" font-family="monospace" font-size="13">Error Code: ERR_CGROUP_OOM_KILLED • Peak Memory: 512.4 MB (Allowed: 256.0 MB)</text>
  <rect x="30" y="160" width="740" height="300" fill="#020617" rx="8" stroke="#334155" stroke-width="1"/>
  <text x="50" y="195" fill="#38bdf8" font-family="monospace" font-size="13">[10:14:02.331] INFO: Launching containerized background worker daemon</text>
  <text x="50" y="220" fill="#fbbf24" font-family="monospace" font-size="13">[10:14:05.819] WARN: Memory usage 92% of threshold [235MB/256MB]</text>
  <text x="50" y="245" fill="#ef4444" font-family="monospace" font-size="13">[10:14:06.104] FATAL: kernel: [4819.123] oom-kill:constraint=CONSTRAINT_MEMCG,nodemask=(null)</text>
  <text x="50" y="270" fill="#f87171" font-family="monospace" font-size="13">   Memory cgroup out of memory: Killed process 4122 (node /bundle.js) total-vm:812MB</text>
  <text x="50" y="295" fill="#f87171" font-family="monospace" font-size="13">   anon-rss:258048kB, file-rss:12288kB, shmem-rss:0kB</text>
  <text x="50" y="325" fill="#94a3b8" font-family="monospace" font-size="12">Audit Reason: Background order synchronization memory leak detected under high order volume</text>
  <text x="50" y="355" fill="#a855f7" font-family="monospace" font-size="12">Cosign SHA-256 Digest: c9f2b87e221379da58f121e7845778841029cba483981772183e84719280d41e</text>
  <text x="50" y="390" fill="#22c55e" font-family="monospace" font-size="12">✔ Automated remediation guide: release unreferenced order models or profile buffer allocations.</text>
</svg>`;
    return `data:image/svg+xml;base64,${typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(svg))) : Buffer.from(svg).toString('base64')}`;
  }

  // Default: Security privilege violation / Printer
  const svg = `<svg width="800" height="500" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="500" fill="#0f172a" rx="16"/>
  <rect width="800" height="48" fill="#1e293b" rx="16"/>
  <rect y="36" width="800" height="12" fill="#1e293b"/>
  <circle cx="28" cy="24" r="7" fill="#ef4444"/>
  <circle cx="48" cy="24" r="7" fill="#eab308"/>
  <circle cx="68" cy="24" r="7" fill="#22c55e"/>
  <text x="96" y="29" fill="#94a3b8" font-family="monospace" font-size="13" font-weight="bold">BizBox Edge Security Audit – Unauthorized Device Access</text>
  <rect x="30" y="70" width="740" height="70" fill="#450a0a" rx="8" stroke="#dc2626" stroke-width="1.5"/>
  <text x="50" y="98" fill="#fca5a5" font-family="sans-serif" font-size="16" font-weight="bold">🚨 CRITICAL AUDIT FAILURE: Sandbox Privilege Violation</text>
  <text x="50" y="122" fill="#fecaca" font-family="monospace" font-size="13">Error Code: ERR_SECURITY_SCOPE_UNAUTHORIZED • Target: /dev/usb/lp0 (Thermal POS Printer)</text>
  <rect x="30" y="160" width="740" height="300" fill="#020617" rx="8" stroke="#334155" stroke-width="1"/>
  <text x="50" y="195" fill="#38bdf8" font-family="monospace" font-size="13">[11:02:18.910] INFO: Validating application bundle manifest declared permissions</text>
  <text x="50" y="220" fill="#fbbf24" font-family="monospace" font-size="13">[11:02:19.412] WARN: App attempted raw system device handle open on /dev/usb/lp0</text>
  <text x="50" y="245" fill="#ef4444" font-family="monospace" font-size="13">[11:02:19.418] FATAL SECURITY EXCEPTION: PermissionDenied: Scope 'device.printer.raw' not declared</text>
  <text x="50" y="270" fill="#f87171" font-family="monospace" font-size="13">   Manifest declared scopes: ['sandbox.storage', 'pos.orders.read']</text>
  <text x="50" y="295" fill="#f87171" font-family="monospace" font-size="13">   Direct raw device write blocked by seccomp sandbox BPF filter.</text>
  <text x="50" y="325" fill="#94a3b8" font-family="monospace" font-size="12">Audit Reason: Package bypassed BizBox Printer Spooler API and attempted raw hardware write</text>
  <text x="50" y="355" fill="#a855f7" font-family="monospace" font-size="12">Cosign SHA-256 Digest: 88efb041a772c9e12019487c9183857ba0928471cba817349198273645019284</text>
  <text x="50" y="390" fill="#22c55e" font-family="monospace" font-size="12">✔ Automated remediation guide: request 'device.printer' scope in manifest.json and use SDK printer service.</text>
</svg>`;
  return `data:image/svg+xml;base64,${typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(svg))) : Buffer.from(svg).toString('base64')}`;
}

