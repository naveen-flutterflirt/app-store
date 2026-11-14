/**
 * Master API & End-to-End Flow Verification Suite
 * Tests all 12 modules, 32+ endpoints, database persistence, and multi-tenant flows.
 */

const http = require('http');
const path = require('path');
require('dotenv').config();

const API_BASE = process.env.API_URL || 'http://127.0.0.1:4000/v1';

interface_run: {
  let passed = 0;
  let failed = 0;
  const results = [];

  async function api(name, path, options = {}) {
    const url = `${API_BASE}${path}`;
    const method = options.method || 'GET';
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const body = options.body ? JSON.stringify(options.body) : undefined;

    try {
      const res = await fetch(url, { method, headers, body });
      let data = null;
      const cType = res.headers.get('content-type') || '';
      if (cType.includes('application/json')) {
        data = await res.json().catch(() => null);
      } else {
        data = await res.text().catch(() => null);
      }

      const expected = options.expectedStatus || [200];
      const isOk = expected.includes(res.status);

      if (isOk && (!options.validate || options.validate(data))) {
        passed++;
        results.push({ name, method, path, status: res.status, ok: true, note: 'PASS' });
        console.log(`  ✓ [${res.status}] ${name}`);
        return { ok: true, status: res.status, data };
      } else {
        failed++;
        const errMsg = data?.message || data?.error || JSON.stringify(data)?.slice(0, 120);
        results.push({ name, method, path, status: res.status, ok: false, note: errMsg });
        console.error(`  ✗ [${res.status}] ${name} -> Expected ${expected}, got ${res.status}: ${errMsg}`);
        return { ok: false, status: res.status, data };
      }
    } catch (err) {
      failed++;
      results.push({ name, method, path, status: 0, ok: false, note: err.message });
      console.error(`  ✗ [ERR] ${name} -> ${err.message}`);
      return { ok: false, status: 0, error: err };
    }
  }

  async function runAll() {
    console.log('================================================================');
    console.log('🚀 MASTER END-TO-END FLOW & API VERIFICATION SUITE');
    console.log(`Target: ${API_BASE}`);
    console.log('================================================================\n');

    // MODULE 1: PLATFORM HEALTH & INDEX
    console.log('▶ [Module 1] System Health & Docs');
    await api('Platform Health Check', '/health', { expectedStatus: [200] });
    await api('API Documentation Landing', '', { expectedStatus: [200] });

    // MODULE 2: AUTHENTICATION FLOW
    console.log('\n▶ [Module 2] Authentication & Token Lifecycle');
    const ownerAuth = await api('Merchant Owner Login', '/auth/login', {
      method: 'POST',
      body: { email: 'owner@brewstreet.com', password: 'password123' },
      expectedStatus: [200],
      validate: (d) => !!d?.token && d?.user?.role === 'owner'
    });
    const ownerToken = ownerAuth.data?.token;

    const devAuth = await api('Developer Login', '/auth/login', {
      method: 'POST',
      body: { email: 'dev@kitchenmetrics.com', password: 'password123' },
      expectedStatus: [200],
      validate: (d) => !!d?.token && d?.user?.role === 'developer'
    });
    const devToken = devAuth.data?.token;
    const devId = devAuth.data?.developer?.id || '60fba5bd-cbc8-4c28-8a53-b6e8e3d45bdf';

    const adminAuth = await api('Admin Reviewer Login', '/auth/login', {
      method: 'POST',
      body: { email: 'admin@flutterflirt.com', password: 'password123' },
      expectedStatus: [200],
      validate: (d) => !!d?.token && d?.user?.role === 'admin'
    });
    const adminToken = adminAuth.data?.token;

    await api('Bad Password Reject', '/auth/login', {
      method: 'POST',
      body: { email: 'dev@kitchenmetrics.com', password: 'wrongpassword' },
      expectedStatus: [401]
    });

    await api('Session Verification (/auth/me)', '/auth/me?tenantId=00000000-0000-0000-0000-000000000001', {
      headers: { Authorization: `Bearer ${ownerToken}` },
      expectedStatus: [200],
      validate: (d) => !!d?.user && !!d?.tenant
    });

    // MODULE 3: DEVELOPER SIGNUP & ONBOARDING
    console.log('\n▶ [Module 3] Self-Service Developer Signup');
    const testDevEmail = `dev_${Date.now()}@innovatetech.io`;
    const signupRes = await api('Developer Self-Signup', '/auth/developer-signup', {
      method: 'POST',
      body: {
        name: 'Arjun Mehta',
        companyName: `Innovate Tech ${Date.now()}`,
        email: testDevEmail,
        password: 'password123',
        website: 'https://innovatetech.io'
      },
      expectedStatus: [201],
      validate: (d) => !!d?.token && !!d?.developer?.id
    });
    const dynamicDevToken = signupRes.data?.token;
    const dynamicDevId = signupRes.data?.developer?.id;

    // MODULE 4: STOREFRONT CATALOG & SEARCH
    console.log('\n▶ [Module 4] Storefront Catalog & Search');
    await api('App Catalog Listing', '/store/apps', {
      expectedStatus: [200],
      validate: (d) => Array.isArray(d) && d.length > 0
    });
    await api('Filter by Category (Operations)', '/store/apps?category=operations', {
      expectedStatus: [200]
    });
    await api('Trigram Search (?q=waste)', '/store/apps?q=waste', {
      expectedStatus: [200]
    });
    await api('Featured Apps Showcase', '/store/featured', {
      expectedStatus: [200]
    });
    await api('Categories Breakdown', '/store/categories', {
      expectedStatus: [200],
      validate: (d) => Array.isArray(d) && d.length > 0
    });
    await api('App Detail by Slug (/store/apps/kds)', '/store/apps/kds', {
      expectedStatus: [200]
    });
    await api('App Ratings & Reviews', '/store/apps/kds/ratings', {
      expectedStatus: [200]
    });

    // MODULE 5: MERCHANT CONSOLE & INSTALLATIONS
    console.log('\n▶ [Module 5] Merchant Console & Installations');
    const tenantId = '00000000-0000-0000-0000-000000000001';
    const installs = await api('Merchant Installed Apps (/installations)', `/installations?tenantId=${tenantId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      expectedStatus: [200]
    });
    await api('Merchant Installed Apps Alias (/apps/installed)', `/apps/installed?tenantId=${tenantId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      expectedStatus: [200]
    });
    await api('Active Subscriptions Preview', `/billing/subscriptions?tenantId=${tenantId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      expectedStatus: [200],
      validate: (d) => !!d?.nextInvoice
    });

    // Toggle auto-update on an existing install
    const firstInstall = installs.data?.[0];
    if (firstInstall?.id) {
      await api('Toggle Auto-Update Setting', `/installations/${firstInstall.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: { autoUpdate: true },
        expectedStatus: [200]
      });
      if (firstInstall.package_id) {
        await api('App Context by Package', `/installations/by-package/${firstInstall.package_id}/context?tenantId=${tenantId}`, {
          headers: { Authorization: `Bearer ${ownerToken}` },
          expectedStatus: [200]
        });
      }
    }

    // MODULE 6: EDGE RUNTIME (PI 5 POS AGENT)
    console.log('\n▶ [Module 6] Edge Agent & POS Node Telemetry');
    const deviceId = '00000000-0000-0000-0000-000000000002';
    await api('Edge Agent Registration', '/edge/agent/register', {
      method: 'POST',
      body: {
        deviceId,
        tenantId,
        hwModel: 'Raspberry Pi 5 Model B (8GB)',
        agentVersion: '1.4.2'
      },
      expectedStatus: [200, 201]
    });
    await api('Fetch Desired-State Manifest', '/edge/agent/desired-state', {
      headers: { 'x-device-id': deviceId },
      expectedStatus: [200]
    });
    await api('Edge Container Registry Token', '/edge/agent/registry-token', {
      headers: { 'x-device-id': deviceId },
      expectedStatus: [200]
    });
    await api('Edge Telemetry & Health Report', '/edge/agent/report', {
      method: 'POST',
      headers: { 'x-device-id': deviceId },
      body: {
        deviceId,
        status: 'online',
        uptimeSeconds: 98200,
        cpuUsagePct: 18.5,
        memoryUsageMb: 1240,
        runningContainers: [{ packageId: 'in.flutterflirt.kds', status: 'running' }]
      },
      expectedStatus: [200, 202]
    });

    // MODULE 7: DEVELOPER PORTAL, TESTING TRACKS & PIPELINE
    console.log('\n▶ [Module 7] Developer Portal & Multi-Track Release Pipeline');
    const activeDevToken = dynamicDevToken || devToken;
    const activeDevId = dynamicDevId || devId;

    await api('Developer - List Apps', '/dev/apps', {
      headers: { Authorization: `Bearer ${activeDevToken}` },
      expectedStatus: [200]
    });
    await api('Developer - List Submissions', '/dev/submissions', {
      headers: { Authorization: `Bearer ${activeDevToken}` },
      expectedStatus: [200]
    });

    // Create a new app
    const tempPkg = `in.innovatetech.app${Date.now().toString().slice(-6)}`;
    const newAppRes = await api('Developer - Create App Listing', '/dev/apps', {
      method: 'POST',
      headers: { Authorization: `Bearer ${activeDevToken}` },
      body: {
        name: 'AI Kitchen Copilot',
        packageId: tempPkg,
        category: 'kitchen',
        summary: 'Smart recipe timing & real-time kitchen assistant',
        description: 'Deep neural network powered recipe and line cook companion for POS',
        runtime: 'hybrid',
        pricingType: 'recurring'
      },
      expectedStatus: [201]
    });

    const newAppId = newAppRes.data?.id;
    if (newAppId) {
      // 1. Create Internal version with full valid manifest
      const verRes = await api('Developer - Create Version (Internal Track)', `/dev/apps/${newAppId}/versions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${activeDevToken}` },
        body: {
          version: '1.0.1',
          channel: 'internal',
          releaseNotes: 'Alpha build for automated test pipeline',
          manifest: {
            id: tempPkg,
            name: 'AI Kitchen Copilot',
            version: '1.0.1',
            runtime: 'hybrid',
            ui: { entry: '/index.html' },
            scopes: [{ scope: 'orders:read', reason: 'Live Kitchen Display' }]
          }
        },
        expectedStatus: [201]
      });

      const verId = verRes.data?.version?.id || verRes.data?.id;
      if (verId) {
        // Submit internal version to automated 6 CI checks
        await api('CI Pipeline - Automated 6 Checks (Internal)', `/dev/versions/${verId}/submit`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${activeDevToken}` },
          expectedStatus: [200],
          validate: (d) => d?.pipelinePassed === true
        });

        // Promote from Internal to Beta track
        await api('Testing Tracks - Promote to Beta', `/dev/versions/${verId}/promote`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${activeDevToken}` },
          body: { targetChannel: 'beta' },
          expectedStatus: [200],
          validate: (d) => d?.channel === 'beta'
        });

        // Promote from Beta to Production (moves to Admin Review Queue)
        await api('Testing Tracks - Promote to Production', `/dev/versions/${verId}/promote`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${activeDevToken}` },
          body: { targetChannel: 'stable' },
          expectedStatus: [200],
          validate: (d) => d?.channel === 'stable' && d?.status === 'in_review'
        });

        // MODULE 8: ADMIN REVIEW & GOVERNANCE
        console.log('\n▶ [Module 8] Admin Review Queue & Cosign Governance');
        const queueRes = await api('Admin - Review Queue', '/admin/review-queue', {
          headers: { Authorization: `Bearer ${adminToken}` },
          expectedStatus: [200]
        });

        await api('Admin - Inspect Version Details', `/admin/versions/${verId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
          expectedStatus: [200]
        });

        await api('Admin - Approve Version', `/admin/versions/${verId}/decision`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
          body: {
            decision: 'approve',
            reviewer: 'admin@flutterflirt.com',
            notes: 'Comprehensive audit passed. Code quality and manifest validated.',
            checklist: { listing: true, publisher: true, permissions: true, pi5: true }
          },
          expectedStatus: [200]
        });

        await api('Admin - Cosign Sign & Publish Version', `/admin/versions/${verId}/publish`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
          body: { rolloutPct: 25 },
          expectedStatus: [200],
          validate: (d) => (d?.version?.status || d?.status) === 'published'
        });

        await api('Developer - Update Rollout to 100%', `/dev/versions/${verId}/rollout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${activeDevToken}` },
          body: { rolloutPct: 100 },
          expectedStatus: [200]
        });
      }

      await api('Developer - App Analytics', `/dev/apps/${newAppId}/analytics`, {
        headers: { Authorization: `Bearer ${activeDevToken}` },
        expectedStatus: [200]
      });

      // MODULE 9: DEVELOPER BANK LINKING & PAYOUT SETTLEMENT
      console.log('\n▶ [Module 9] Developer Bank Linking, 80/20 RevShare & Admin Settlement');
      await api('Developer - Save Bank & PAN Credentials', '/dev/payout-settings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${activeDevToken}` },
        body: {
          accountHolder: 'Innovate Tech Private Limited',
          bankName: 'HDFC Bank Ltd',
          accountNumber: '50100987654321',
          ifscCode: 'HDFC0000456',
          panNumber: 'AAACK9999F'
        },
        expectedStatus: [200],
        validate: (d) => d?.success === true
      });

      await api('Developer - Earnings Ledger (80/20 & TDS)', '/dev/earnings', {
        headers: { Authorization: `Bearer ${activeDevToken}` },
        expectedStatus: [200],
        validate: (d) => !!d?.developer && !!d?.metrics
      });

      await api('Admin - Developers Directory', '/admin/developers', {
        headers: { Authorization: `Bearer ${adminToken}` },
        expectedStatus: [200],
        validate: (d) => Array.isArray(d) && d.length > 0
      });

      await api('Admin - Payouts & Settlement Overview', '/admin/payouts/overview', {
        headers: { Authorization: `Bearer ${adminToken}` },
        expectedStatus: [200],
        validate: (d) => !!d?.summary && Array.isArray(d?.developers)
      });

      await api('Admin - Execute Payout Settlement', `/admin/payouts/pay/${activeDevId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { amount: 323.28 },
        expectedStatus: [200],
        validate: (d) => d?.payout?.status === 'paid' && !!(d?.payout?.provider_ref || d?.payout?.provider_reference)
      });

      await api('Admin - Monthly Batch Payouts Calculation', '/admin/payouts/run', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { periodStart: '2026-10-01', periodEnd: '2026-10-31' },
        expectedStatus: [200]
      });

      // MODULE 10: ADMIN STORE METRICS
      console.log('\n▶ [Module 10] Admin Platform Metrics & KPIs');
      await api('Admin - Store KPI Metrics', '/admin/metrics', {
        headers: { Authorization: `Bearer ${adminToken}` },
        expectedStatus: [200],
        validate: (d) => d?.listed_apps > 0
      });

      // MODULE 11: BILLING WEBHOOKS
      console.log('\n▶ [Module 11] Razorpay Billing Webhooks');
      await api('Razorpay Webhook (subscription.charged)', '/webhooks/billing/razorpay', {
        method: 'POST',
        body: {
          event: 'subscription.charged',
          payload: { subscription_id: 'sub_live_test_01' }
        },
        expectedStatus: [200]
      });

      // MODULE 12: CLEANUP
      console.log('\n▶ [Module 12] Developer App Deletion & Cleanup');
      await api('Cascade App Deletion', `/dev/apps/${newAppId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${activeDevToken}` },
        expectedStatus: [200]
      });
    }

    console.log('\n================================================================');
    console.log('📊 FINAL TEST RESULTS REPORT');
    console.log('================================================================');
    console.log(`Total APIs Tested : ${passed + failed}`);
    console.log(`Passed            : ${passed} ✅`);
    console.log(`Failed            : ${failed} ${failed === 0 ? '🎉' : '❌'}`);
    console.log('================================================================');

    if (failed > 0) {
      console.error(`\nFAILED TESTS (${failed}):`);
      results.filter(r => !r.ok).forEach(r => {
        console.error(`  - [${r.method} ${r.path}] (${r.status}): ${r.note}`);
      });
      process.exit(1);
    } else {
      console.log('\n🎉 ALL 32+ APIS AND END-TO-END PLATFORM FLOWS PASSED 100%!');
      process.exit(0);
    }
  }

  runAll().catch(err => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
}
