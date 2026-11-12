import http from 'http';
import handler from '../api/index';

// Wrap the native server handler into a local test server
function createTestServer(): Promise<{ server: http.Server; url: string }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      handler(req, res);
    });
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as any).port;
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

interface TestResult {
  flow: string;
  endpoint: string;
  method: string;
  status: number;
  expectedStatus: number[];
  passed: boolean;
  notes?: string;
}

const results: TestResult[] = [];

async function testApi(
  flow: string,
  url: string,
  options: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: any;
    expectedStatus: number[];
  }
) {
  const reqUrl = `${url}${options.path}`;
  const res = await fetch(reqUrl, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let data: any = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }

  const passed = options.expectedStatus.includes(res.status);
  results.push({
    flow,
    endpoint: options.path,
    method: options.method,
    status: res.status,
    expectedStatus: options.expectedStatus,
    passed,
    notes: passed ? 'OK' : `Failed: got ${res.status}, body: ${JSON.stringify(data).slice(0, 100)}`
  });

  return { status: res.status, data };
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🚀 STARTING COMPREHENSIVE END-TO-END API TEST SUITE');
  console.log('================================================================\n');

  const { server, url } = await createTestServer();
  console.log(`Local Test Gateway listening on ${url}\n`);

  try {
    // -------------------------------------------------------------
    // FLOW 1: SYSTEM & HEALTH FLOW
    // -------------------------------------------------------------
    console.log('▶ [Flow 1] System & Platform Health');
    await testApi('System Health', url, {
      method: 'GET',
      path: '/v1/health',
      expectedStatus: [200]
    });
    await testApi('System Docs', url, {
      method: 'GET',
      path: '/v1',
      expectedStatus: [200]
    });

    // -------------------------------------------------------------
    // FLOW 2: AUTHENTICATION FLOW
    // -------------------------------------------------------------
    console.log('▶ [Flow 2] Authentication & Token Lifecycle');
    // Owner Login
    const ownerAuth = await testApi('Auth - Owner Login', url, {
      method: 'POST',
      path: '/v1/auth/login',
      body: { email: 'owner@brewstreet.com', password: 'password123' },
      expectedStatus: [200]
    });
    const ownerToken = ownerAuth.data?.token;

    // Developer Login
    const devAuth = await testApi('Auth - Developer Login', url, {
      method: 'POST',
      path: '/v1/auth/login',
      body: { email: 'dev@kitchenmetrics.com', password: 'password123' },
      expectedStatus: [200]
    });
    const devToken = devAuth.data?.token;
    const devId = devAuth.data?.developer?.id || '60fba5bd-cbc8-4c28-8a53-b6e8e3d45bdf';

    // Admin Login
    const adminAuth = await testApi('Auth - Admin Login', url, {
      method: 'POST',
      path: '/v1/auth/login',
      body: { email: 'admin@flutterflirt.com', password: 'password123' },
      expectedStatus: [200]
    });

    // Invalid Login
    await testApi('Auth - Bad Credentials', url, {
      method: 'POST',
      path: '/v1/auth/login',
      body: { email: 'fake@example.com', password: 'wrong' },
      expectedStatus: [401]
    });

    // Current Session (Auth Me)
    await testApi('Auth - Current Session', url, {
      method: 'GET',
      path: '/v1/auth/me?tenantId=00000000-0000-0000-0000-000000000001',
      headers: { Authorization: `Bearer ${ownerToken}` },
      expectedStatus: [200]
    });

    // -------------------------------------------------------------
    // FLOW 3: PUBLIC STOREFRONT FLOW
    // -------------------------------------------------------------
    console.log('▶ [Flow 3] Public Storefront Flow');
    await testApi('Storefront - App Catalog', url, {
      method: 'GET',
      path: '/v1/store/apps',
      expectedStatus: [200]
    });
    await testApi('Storefront - Filter by Category', url, {
      method: 'GET',
      path: '/v1/store/apps?category=operations',
      expectedStatus: [200]
    });
    await testApi('Storefront - Search Query', url, {
      method: 'GET',
      path: '/v1/store/apps?q=waste',
      expectedStatus: [200]
    });
    await testApi('Storefront - Featured Apps', url, {
      method: 'GET',
      path: '/v1/store/featured',
      expectedStatus: [200]
    });
    await testApi('Storefront - Categories', url, {
      method: 'GET',
      path: '/v1/store/categories',
      expectedStatus: [200]
    });
    // Detail & Ratings for an app (e.g. kitchen-display)
    await testApi('Storefront - App Detail', url, {
      method: 'GET',
      path: '/v1/store/apps/kitchen-display',
      expectedStatus: [200, 404]
    });
    await testApi('Storefront - App Ratings', url, {
      method: 'GET',
      path: '/v1/store/apps/kitchen-display/ratings',
      expectedStatus: [200]
    });

    // -------------------------------------------------------------
    // FLOW 4: MERCHANT CONSOLE & INSTALLATION FLOW
    // -------------------------------------------------------------
    console.log('▶ [Flow 4] Merchant Console & Installations Flow');
    const tenantId = '00000000-0000-0000-0000-000000000001';
    
    // List installations for tenant
    const instList = await testApi('Merchant - Installed Apps', url, {
      method: 'GET',
      path: `/v1/installations?tenantId=${tenantId}`,
      headers: { Authorization: `Bearer ${ownerToken}` },
      expectedStatus: [200]
    });

    // Merchant Subscriptions
    await testApi('Merchant - Subscriptions', url, {
      method: 'GET',
      path: `/v1/billing/subscriptions?tenantId=${tenantId}`,
      headers: { Authorization: `Bearer ${ownerToken}` },
      expectedStatus: [200]
    });

    // Install an app
    const installAttempt = await testApi('Merchant - Install App', url, {
      method: 'POST',
      path: '/v1/installations',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        tenantId,
        appId: '13db06c9-041f-4b07-9b2f-762bc104fa28', // Stock Predictor or existing
        channel: 'stable'
      },
      expectedStatus: [201, 200, 400] // 400 if already installed or bad plan
    });

    // If an installation exists, test toggle auto-update & context API
    const existingInstId = instList.data?.[0]?.id;
    if (existingInstId) {
      await testApi('Merchant - Update Auto-Update Setting', url, {
        method: 'PATCH',
        path: `/v1/installations/${existingInstId}`,
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: { auto_update: true },
        expectedStatus: [200]
      });

      const pkgId = instList.data?.[0]?.package_id;
      if (pkgId) {
        await testApi('Merchant - App Context by Package', url, {
          method: 'GET',
          path: `/v1/installations/by-package/${pkgId}/context?tenantId=${tenantId}`,
          headers: { Authorization: `Bearer ${ownerToken}` },
          expectedStatus: [200]
        });
      }
    }

    // -------------------------------------------------------------
    // FLOW 5: EDGE DEVICE AGENT FLOW (Pi 5 Runtime)
    // -------------------------------------------------------------
    console.log('▶ [Flow 5] Edge Agent & POS Runtime Flow');
    const deviceId = '00000000-0000-0000-0000-000000000002';
    
    // Register Device
    await testApi('Edge - Device Registration', url, {
      method: 'POST',
      path: '/v1/edge/agent/register',
      body: {
        deviceId,
        tenantId,
        hwModel: 'Raspberry Pi 5 Model B Rev 1.0 (8GB)',
        agentVersion: '1.4.2'
      },
      expectedStatus: [200, 201]
    });

    // Pull Desired State
    await testApi('Edge - Desired State', url, {
      method: 'GET',
      path: '/v1/edge/agent/desired-state',
      headers: { 'x-device-id': deviceId },
      expectedStatus: [200]
    });

    // Get Registry Token (zot OCI registry)
    await testApi('Edge - Registry Token', url, {
      method: 'GET',
      path: '/v1/edge/agent/registry-token',
      headers: { 'x-device-id': deviceId },
      expectedStatus: [200]
    });

    // Report Telemetry & Edge Status
    await testApi('Edge - Report Status', url, {
      method: 'POST',
      path: '/v1/edge/agent/report',
      headers: { 'x-device-id': deviceId },
      body: {
        deviceId,
        status: 'online',
        uptimeSeconds: 84600,
        cpuUsagePct: 14.2,
        memoryUsageMb: 890,
        runningContainers: []
      },
      expectedStatus: [202]
    });

    // -------------------------------------------------------------
    // FLOW 6: DEVELOPER PORTAL & CI LIFECYCLE FLOW
    // -------------------------------------------------------------
    console.log('▶ [Flow 6] Developer Portal & Publishing CI Lifecycle');
    // List Developer Apps
    const devApps = await testApi('Dev - List My Apps', url, {
      method: 'GET',
      path: '/v1/dev/apps',
      headers: { 'x-developer-id': devId },
      expectedStatus: [200]
    });

    // List Developer Submissions
    await testApi('Dev - List Submissions', url, {
      method: 'GET',
      path: '/v1/dev/submissions',
      headers: { 'x-developer-id': devId },
      expectedStatus: [200]
    });

    // Create a new draft app
    const tempPkg = `com.kitchenmetrics.testapp${Date.now()}`;
    const createApp = await testApi('Dev - Create App Listing', url, {
      method: 'POST',
      path: '/v1/dev/apps',
      headers: { 'x-developer-id': devId },
      body: {
        name: 'Automated Pipeline App',
        packageId: tempPkg,
        category: 'operations',
        summary: 'Automated flow test application',
        description: 'Comprehensive API integration test application',
        runtime: 'edge_isolated',
        pricingType: 'free'
      },
      expectedStatus: [201]
    });

    const createdAppId = createApp.data?.id;
    if (createdAppId) {
      // Create version
      const createVersion = await testApi('Dev - Create App Version', url, {
        method: 'POST',
        path: `/v1/dev/apps/${createdAppId}/versions`,
        body: {
          version: '1.0.0',
          channel: 'stable',
          bundleUrl: 'https://registry.bizbox.io/bundles/test.tar.gz',
          releaseNotes: 'Initial automated integration release'
        },
        expectedStatus: [201]
      });

      const versionId = createVersion.data?.id;
      if (versionId) {
        // Trigger automated CI submission
        await testApi('Dev - Submit Version to CI', url, {
          method: 'POST',
          path: `/v1/dev/versions/${versionId}/submit`,
          expectedStatus: [200]
        });

        // Developer Rollout update
        await testApi('Dev - Update Rollout Percentage', url, {
          method: 'POST',
          path: `/v1/dev/versions/${versionId}/rollout`,
          body: { rolloutPct: 25 },
          expectedStatus: [200]
        });
      }

      // Developer Analytics
      await testApi('Dev - App Analytics', url, {
        method: 'GET',
        path: `/v1/dev/apps/${createdAppId}/analytics`,
        expectedStatus: [200]
      });

      // Developer Cascade Delete
      await testApi('Dev - Permanent App Cascade Deletion', url, {
        method: 'DELETE',
        path: `/v1/dev/apps/${createdAppId}`,
        headers: { 'x-developer-id': devId },
        expectedStatus: [200]
      });
    }

    // -------------------------------------------------------------
    // FLOW 7: ADMIN REVIEW QUEUE & GOVERNANCE FLOW
    // -------------------------------------------------------------
    console.log('▶ [Flow 7] Admin Review Queue, Decisions & Audit');
    // Review Queue
    const reviewQueue = await testApi('Admin - Get Review Queue', url, {
      method: 'GET',
      path: '/v1/admin/review-queue',
      expectedStatus: [200]
    });

    // Version Review Detail
    const reviewItem = reviewQueue.data?.[0];
    if (reviewItem) {
      await testApi('Admin - Get Version Review Detail', url, {
        method: 'GET',
        path: `/v1/admin/versions/${reviewItem.version_id}`,
        expectedStatus: [200]
      });

      // Submit Review Decision (Approve)
      await testApi('Admin - Submit Review Decision', url, {
        method: 'POST',
        path: `/v1/admin/versions/${reviewItem.version_id}/decision`,
        body: {
          decision: 'approve',
          reviewer: 'admin@flutterflirt.com',
          notes: 'Automated test suite approval',
          checklist: { listing: true, publisher: true, permissions: true, pi5: true }
        },
        expectedStatus: [200]
      });

      // Cosign Bundle Signing & Publish
      await testApi('Admin - Sign & Publish Version', url, {
        method: 'POST',
        path: `/v1/admin/versions/${reviewItem.version_id}/publish`,
        body: { rolloutPct: 15 },
        expectedStatus: [200]
      });
    }

    // Admin Store Metrics & KPIs
    await testApi('Admin - Store Metrics', url, {
      method: 'GET',
      path: '/v1/admin/metrics',
      expectedStatus: [200]
    });

    // Monthly Developer Payouts (80/20 split engine)
    await testApi('Admin - Run Monthly Payouts', url, {
      method: 'POST',
      path: '/v1/admin/payouts/run',
      body: { periodStart: '2026-10-01', periodEnd: '2026-10-31' },
      expectedStatus: [200]
    });

    // Webhook Billing Flow (Razorpay mock)
    await testApi('Billing - Razorpay Webhook', url, {
      method: 'POST',
      path: '/v1/webhooks/billing/razorpay',
      body: {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_test_' + Date.now(),
              amount: 49900,
              currency: 'INR',
              status: 'captured'
            }
          }
        }
      },
      expectedStatus: [200]
    });

  } finally {
    server.close();
  }

  // Print Summary Table
  console.log('\n================================================================');
  console.log('📊 TEST EXECUTION SUMMARY REPORT');
  console.log('================================================================');
  console.table(
    results.map(r => ({
      Flow: r.flow,
      Method: r.method,
      Endpoint: r.endpoint,
      Status: r.status,
      Passed: r.passed ? '✅ YES' : '❌ NO'
    }))
  );

  const total = results.length;
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = total - passedCount;

  console.log(`\nTotal Tests: ${total} | Passed: ${passedCount} | Failed: ${failedCount}`);
  if (failedCount > 0) {
    console.error('❌ SOME TESTS FAILED');
    process.exit(1);
  } else {
    console.log('🎉 ALL APIS AND FLOWS VERIFIED SUCCESSFULLY');
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
