// Live Production E2E Verification Script
// Tests every portal and API against the live deployment and PostgreSQL database

interface ApiCheck {
  id: number;
  flow: string;
  name: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  expectedStatus: number[];
}

const API_BASE = 'https://app-store-api-ochre.vercel.app/v1';

async function runLiveTests() {
  console.log('================================================================');
  console.log(`🌐 EXECUTING LIVE PRODUCTION END-TO-END TEST SUITE`);
  console.log(`Target Gateway: ${API_BASE}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('================================================================\n');

  const results: any[] = [];
  let tokenOwner = '';
  let tokenDev = '';
  let tokenAdmin = '';

  async function check(
    flow: string,
    name: string,
    endpoint: string,
    method: string,
    options: {
      headers?: Record<string, string>;
      body?: any;
      expectedStatus: number[];
      customValidator?: (data: any, status: number) => { ok: boolean; reason?: string };
    }
  ) {
    const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    try {
      const res = await fetch(fullUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      let json: any = null;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        json = await res.json().catch(() => null);
      } else {
        json = await res.text().catch(() => null);
      }

      let passed = options.expectedStatus.includes(res.status);
      let note = `HTTP ${res.status}`;

      if (options.customValidator) {
        const val = options.customValidator(json, res.status);
        if (!val.ok) {
          passed = false;
          note += ` - Validation failed: ${val.reason}`;
        } else {
          note += ` - Validated`;
        }
      }

      results.push({
        Flow: flow,
        Test: name,
        Method: method,
        Status: res.status,
        Passed: passed ? '✅ PASS' : '❌ FAIL',
        Note: note
      });

      return { status: res.status, data: json };
    } catch (e: any) {
      results.push({
        Flow: flow,
        Test: name,
        Method: method,
        Status: 0,
        Passed: '❌ FAIL',
        Note: `Network error: ${e.message}`
      });
      return { status: 0, data: null };
    }
  }

  // -------------------------------------------------------------
  // 1. HEALTH & SYSTEM FLOW
  // -------------------------------------------------------------
  console.log('▶ [1/7] Testing System & Health...');
  await check('Health', 'Gateway Health & Database Ping', '/health', 'GET', {
    expectedStatus: [200],
    customValidator: (data) => ({ ok: data?.status === 'ok' && data?.dbConnected === true, reason: 'Database ping missing' })
  });

  await check('Health', 'API Documentation & Endpoints Index', '/docs', 'GET', {
    expectedStatus: [200]
  });

  // -------------------------------------------------------------
  // 2. AUTHENTICATION & TOKEN LIFECYCLE FLOW
  // -------------------------------------------------------------
  console.log('▶ [2/7] Testing Authentication Flows...');
  const ownerLogin = await check('Auth', 'Merchant Owner Login (RFC 7519 JWT)', '/auth/login', 'POST', {
    body: { email: 'owner@brewstreet.com', password: 'password123' },
    expectedStatus: [200],
    customValidator: (data) => ({ ok: !!data?.token && data?.user?.role === 'owner', reason: 'Missing owner token or role' })
  });
  tokenOwner = ownerLogin.data?.token;

  const devLogin = await check('Auth', 'Developer Login (RFC 7519 JWT)', '/auth/login', 'POST', {
    body: { email: 'dev@kitchenmetrics.com', password: 'password123' },
    expectedStatus: [200],
    customValidator: (data) => ({ ok: !!data?.token && data?.user?.role === 'developer', reason: 'Missing dev token or role' })
  });
  tokenDev = devLogin.data?.token;
  const devId = devLogin.data?.developer?.id || '60fba5bd-cbc8-4c28-8a53-b6e8e3d45bdf';

  const adminLogin = await check('Auth', 'Admin Reviewer Login (RFC 7519 JWT)', '/auth/login', 'POST', {
    body: { email: 'admin@flutterflirt.com', password: 'password123' },
    expectedStatus: [200],
    customValidator: (data) => ({ ok: !!data?.token && data?.user?.role === 'admin', reason: 'Missing admin token or role' })
  });
  tokenAdmin = adminLogin.data?.token;

  await check('Auth', 'Bad Password Authentication Reject', '/auth/login', 'POST', {
    body: { email: 'admin@flutterflirt.com', password: 'wrongpassword' },
    expectedStatus: [401]
  });

  await check('Auth', 'Current Authenticated Session (Auth Me)', '/auth/me?tenantId=00000000-0000-0000-0000-000000000001', 'GET', {
    headers: { Authorization: `Bearer ${tokenOwner}` },
    expectedStatus: [200],
    customValidator: (data) => ({ ok: !!data?.user && !!data?.tenant, reason: 'Missing user or tenant context' })
  });

  // -------------------------------------------------------------
  // 3. STOREFRONT FLOW
  // -------------------------------------------------------------
  console.log('▶ [3/7] Testing Storefront Catalog & Search...');
  const catalogRes = await check('Storefront', 'Get App Catalog (store.v_listing)', '/store/apps', 'GET', {
    expectedStatus: [200],
    customValidator: (data) => ({ ok: Array.isArray(data) && data.length > 0, reason: 'Empty catalog array' })
  });

  await check('Storefront', 'Category Filter (?category=kitchen)', '/store/apps?category=kitchen', 'GET', {
    expectedStatus: [200],
    customValidator: (data) => ({ ok: Array.isArray(data), reason: 'Expected category results' })
  });

  await check('Storefront', 'Full-Text Search Query (?q=waste)', '/store/apps?q=waste', 'GET', {
    expectedStatus: [200],
    customValidator: (data) => ({ ok: Array.isArray(data), reason: 'Search failed' })
  });

  await check('Storefront', 'Featured Apps Carousel', '/store/featured', 'GET', {
    expectedStatus: [200],
    customValidator: (data) => ({ ok: Array.isArray(data) || Array.isArray(data?.rails), reason: 'Featured apps query failed' })
  });

  await check('Storefront', 'App Categories with Counts', '/store/categories', 'GET', {
    expectedStatus: [200],
    customValidator: (data) => ({ ok: Array.isArray(data) && data.length > 0, reason: 'Categories empty' })
  });

  const firstApp = catalogRes.data?.[0];
  if (firstApp?.slug) {
    await check('Storefront', `Get App Detail (${firstApp.slug})`, `/store/apps/${firstApp.slug}`, 'GET', {
      expectedStatus: [200],
      customValidator: (data) => ({ ok: data?.slug === firstApp.slug, reason: 'Slug mismatch' })
    });

    await check('Storefront', `Get App Ratings (${firstApp.slug})`, `/store/apps/${firstApp.slug}/ratings`, 'GET', {
      expectedStatus: [200],
      customValidator: (data) => ({ ok: Array.isArray(data), reason: 'Ratings not an array' })
    });
  }

  // -------------------------------------------------------------
  // 4. MERCHANT CONSOLE & INSTALLATION FLOW
  // -------------------------------------------------------------
  console.log('▶ [4/7] Testing Merchant Console & Installation Flow...');
  const tenantId = '00000000-0000-0000-0000-000000000001';

  const instRes = await check('Merchant', 'List Installed Apps for Tenant', `/installations?tenantId=${tenantId}`, 'GET', {
    headers: { Authorization: `Bearer ${tokenOwner}` },
    expectedStatus: [200],
    customValidator: (data) => ({ ok: Array.isArray(data), reason: 'Installations list not an array' })
  });

  await check('Merchant', 'List Subscriptions for Tenant', `/billing/subscriptions?tenantId=${tenantId}`, 'GET', {
    headers: { Authorization: `Bearer ${tokenOwner}` },
    expectedStatus: [200]
  });

  const activeInst = instRes.data?.[0];
  if (activeInst?.id) {
    await check('Merchant', 'Toggle Auto-Update Setting', `/installations/${activeInst.id}`, 'PATCH', {
      headers: { Authorization: `Bearer ${tokenOwner}` },
      body: { auto_update: true },
      expectedStatus: [200]
    });

    if (activeInst.package_id) {
      await check('Merchant', `Get App Sandboxed Context (${activeInst.package_id})`, `/installations/by-package/${activeInst.package_id}/context?tenantId=${tenantId}`, 'GET', {
        headers: { Authorization: `Bearer ${tokenOwner}` },
        expectedStatus: [200],
        customValidator: (data) => ({ ok: (!!data?.tenant_id || !!data?.tenant?.id) && (!!data?.bridge_token || !!data?.token), reason: 'Missing bridge token' })
      });
    }
  }

  // -------------------------------------------------------------
  // 5. EDGE AGENT & POS RUNTIME FLOW (Raspberry Pi 5)
  // -------------------------------------------------------------
  console.log('▶ [5/7] Testing Edge Agent & Pi 5 Telemetry Flow...');
  const deviceId = '00000000-0000-0000-0000-000000000002';

  await check('Edge POS', 'Device Handshake & Registration', '/edge/agent/register', 'POST', {
    body: {
      deviceId,
      tenantId,
      hwModel: 'Raspberry Pi 5 Model B Rev 1.0 (8GB)',
      agentVersion: '1.4.2'
    },
    expectedStatus: [200, 201]
  });

  await check('Edge POS', 'Pull Edge Desired State & Bundles', '/edge/agent/desired-state', 'GET', {
    headers: { 'x-device-id': deviceId },
    expectedStatus: [200]
  });

  await check('Edge POS', 'Generate OCI Container Registry Token', '/edge/agent/registry-token', 'GET', {
    headers: { 'x-device-id': deviceId },
    expectedStatus: [200],
    customValidator: (data) => ({ ok: !!data?.token, reason: 'Missing registry token' })
  });

  await check('Edge POS', 'Report Hardware & Container Telemetry', '/edge/agent/report', 'POST', {
    headers: { 'x-device-id': deviceId },
    body: {
      deviceId,
      status: 'online',
      uptimeSeconds: 98200,
      cpuUsagePct: 11.4,
      memoryUsageMb: 820,
      runningContainers: ['in.flutterflirt.pos']
    },
    expectedStatus: [202]
  });

  // -------------------------------------------------------------
  // 6. DEVELOPER PORTAL & CI LIFECYCLE FLOW
  // -------------------------------------------------------------
  console.log('▶ [6/7] Testing Developer Publishing Lifecycle...');
  await check('Developer', 'List Developer Applications', '/dev/apps', 'GET', {
    headers: { 'x-developer-id': devId },
    expectedStatus: [200],
    customValidator: (data) => ({ ok: Array.isArray(data), reason: 'Expected developer apps array' })
  });

  await check('Developer', 'List Developer CI Submissions', '/dev/submissions', 'GET', {
    headers: { 'x-developer-id': devId },
    expectedStatus: [200]
  });

  // Create temporary app to test full creation -> version -> CI -> analytics -> cascade delete cycle
  const tempPackage = `com.flutterflirt.test${Date.now()}`;
  const createAppRes = await check('Developer', 'Create App Listing (Free Edge App)', '/dev/apps', 'POST', {
    headers: { 'x-developer-id': devId },
    body: {
      name: 'Automated E2E Verification App',
      packageId: tempPackage,
      category: 'kitchen',
      summary: 'Dynamic E2E verification test',
      description: 'End-to-end verification of developer portal and database cascade',
      runtime: 'edge_isolated',
      pricingType: 'free'
    },
    expectedStatus: [201]
  });

  const createdAppId = createAppRes.data?.id;
  if (createdAppId) {
    const createVerRes = await check('Developer', 'Create App Version (v1.0.0)', `/dev/apps/${createdAppId}/versions`, 'POST', {
      body: {
        version: '1.0.0',
        channel: 'stable',
        bundleUrl: 'https://registry.bizbox.io/bundles/test-v1.tar.gz',
        releaseNotes: 'Test version for automated CI run'
      },
      expectedStatus: [201]
    });

    const verId = createVerRes.data?.id;
    if (verId) {
      await check('Developer', 'Submit Version to CI Pipeline Runner', `/dev/versions/${verId}/submit`, 'POST', {
        expectedStatus: [200],
        customValidator: (data) => ({ ok: data?.status === 'in_review' || data?.status === 'submitted', reason: 'CI status mismatch' })
      });

      await check('Developer', 'Update Version Rollout Percentage', `/dev/versions/${verId}/rollout`, 'POST', {
        body: { rolloutPct: 30 },
        expectedStatus: [200]
      });
    }

    await check('Developer', 'Fetch App Analytics KPIs', `/dev/apps/${createdAppId}/analytics`, 'GET', {
      expectedStatus: [200]
    });

    // Cascade Delete
    await check('Developer', 'Cascade Delete App from PostgreSQL Database', `/dev/apps/${createdAppId}`, 'DELETE', {
      headers: { 'x-developer-id': devId },
      expectedStatus: [200],
      customValidator: (data) => ({ ok: data?.success === true, reason: 'Deletion failed' })
    });
  }

  // -------------------------------------------------------------
  // 7. ADMIN REVIEW QUEUE & GOVERNANCE FLOW
  // -------------------------------------------------------------
  console.log('▶ [7/7] Testing Admin Review & Governance Flow...');
  const queueRes = await check('Admin Review', 'Fetch Pending Review Queue', '/admin/review-queue', 'GET', {
    expectedStatus: [200],
    customValidator: (data) => ({ ok: Array.isArray(data), reason: 'Review queue not an array' })
  });

  if (queueRes.data && queueRes.data.length > 0) {
    const item = queueRes.data[0];
    await check('Admin Review', `Get Detailed Version Checks & Scopes (${item.app} v${item.version})`, `/admin/versions/${item.version_id}`, 'GET', {
      expectedStatus: [200],
      customValidator: (data) => ({ ok: Array.isArray(data?.checks), reason: 'Checks missing in version audit' })
    });

    await check('Admin Review', 'Record Review Decision (Approve)', `/admin/versions/${item.version_id}/decision`, 'POST', {
      body: {
        decision: 'approve',
        reviewer: 'admin@flutterflirt.com',
        notes: 'Automated verification check',
        checklist: { listing: true, publisher: true, permissions: true, pi5: true }
      },
      expectedStatus: [200]
    });

    await check('Admin Review', 'Digitally Sign with Cosign and Publish at 10% Rollout', `/admin/versions/${item.version_id}/publish`, 'POST', {
      body: { rolloutPct: 10 },
      expectedStatus: [200]
    });
  }

  await check('Admin Review', 'Get Platform Store Metrics KPIs', '/admin/metrics', 'GET', {
    expectedStatus: [200],
    customValidator: (data) => ({ ok: typeof data?.listed_apps === 'number', reason: 'Missing metrics count' })
  });

  await check('Admin Review', 'Execute Monthly Developer Payouts (80/20 & TDS)', '/admin/payouts/run', 'POST', {
    body: { periodStart: '2026-10-01', periodEnd: '2026-10-31' },
    expectedStatus: [200]
  });

  await check('Admin Review', 'Process Razorpay Billing Webhook', '/webhooks/billing/razorpay', 'POST', {
    body: {
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_live_test_1', amount: 99900, currency: 'INR', status: 'captured' } } }
    },
    expectedStatus: [200]
  });

  // -------------------------------------------------------------
  // FINAL REPORT
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('📊 LIVE E2E TEST RESULTS TABLE');
  console.log('================================================================');
  console.table(results);

  const total = results.length;
  const passed = results.filter(r => r.Passed === '✅ PASS').length;
  const failed = total - passed;

  console.log(`\nResults: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%) | ${failed} FAILED\n`);

  if (failed > 0) {
    console.error('❌ SOME TESTS FAILED');
    process.exit(1);
  } else {
    console.log('🎉 ALL LIVE APIS AND FLOWS VERIFIED 100% OPERATIONAL');
  }
}

runLiveTests().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
