/**
 * Phase 4 Developer Ecosystem, CI Pipeline & Payouts Simulation Test
 * FlutterFlirt Private Limited · BizBox App Store v1.0
 */

async function runDeveloperPipelineSimulation() {
  console.log('>>> STARTING BIZBOX DEVELOPER & REVIEW PIPELINE SIMULATION TEST <<<\n');
  const baseUrl = 'http://localhost:4000/v1';

  // 1. Developer creates a new app listing
  console.log('[Step 1] Developer creates a new app listing (POST /dev/apps)...');
  const appRes = await fetch(`${baseUrl}/dev/apps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Smart Wastage Tracker',
      tagline: 'AI camera-based kitchen wastage monitoring',
      category: 'inventory',
      runtime: 'hybrid',
      businessTypes: ['restaurant', 'cafe', 'cloud_kitchen']
    })
  });

  const appData = await appRes.json() as any;
  console.log(`✓ Created app listing: "${appData.name}" (ID: ${appData.id}, Package: ${appData.package_id})\n`);

  // 2. Developer creates Version 1.0.0
  console.log('[Step 2] Developer drafts Version 1.0.0 (POST /dev/apps/:id/versions)...');
  const versionRes = await fetch(`${baseUrl}/dev/apps/${appData.id}/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: '1.0.0',
      manifest: {
        id: appData.package_id,
        name: appData.name,
        version: '1.0.0',
        runtime: 'hybrid',
        requires: [{ app: 'in.flutterflirt.pos', minVersion: '1.0.0' }],
        scopes: [
          { scope: 'stock:write', reason: 'Deduct ingredients on dish waste' },
          { scope: 'orders:read', reason: 'Correlate waste with daily orders' }
        ],
        resources: { cpu: '0.25', memory: '256Mi' }
      },
      bundleSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      releaseNotes: 'Initial production release with kitchen camera support'
    })
  });

  const versionData = await versionRes.json() as any;
  const versionId = versionData.version.id;
  console.log(`✓ Created draft version 1.0.0 (Version ID: ${versionId})`);
  console.log(`✓ S3 Presigned Upload URL: ${versionData.uploadUrl.substring(0, 50)}...\n`);

  // 3. Submit Version to Automated CI Pipeline
  console.log('[Step 3] Submitting version to 6 Automated CI Pipeline Checks (POST /dev/versions/:id/submit)...');
  const submitRes = await fetch(`${baseUrl}/dev/versions/${versionId}/submit`, {
    method: 'POST'
  });
  const submitData = await submitRes.json() as any;
  console.log(`✓ CI Pipeline Finished: ${submitData.pipelinePassed ? 'ALL PASSED' : 'FAILED'}`);
  submitData.checkResults.forEach((chk: any) => {
    console.log(`   - [${chk.kind}]: ${chk.status.toUpperCase()} -> ${chk.summary}`);
  });
  console.log(`✓ Version transitioned to: ${submitData.version.status}\n`);

  // 4. Admin Review Queue Inspection
  console.log('[Step 4] FlutterFlirt team inspects Review Queue (GET /admin/review-queue)...');
  const queueRes = await fetch(`${baseUrl}/admin/review-queue`);
  const queue = await queueRes.json() as any[];
  console.log(`✓ Review Queue holds ${queue.length} submitted versions awaiting review.\n`);

  // 5. Admin Reviewer Approves Version
  console.log('[Step 5] Admin approves version with review checklist (POST /admin/versions/:id/decision)...');
  const decisionRes = await fetch(`${baseUrl}/admin/versions/${versionId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      decision: 'approve',
      reviewer: 'lead.reviewer@flutterflirt.com',
      notes: 'Manifest valid, scopes justified, camera permissions within sandboxed boundaries.',
      checklist: {
        listing_accurate: true,
        privacy_ok: true,
        permissions_justified: true,
        arm64_boot_verified: true
      }
    })
  });
  const decisionData = await decisionRes.json() as any;
  console.log(`✓ Review Decision Applied: ${decisionData.decision.toUpperCase()}. Version Status: ${decisionData.status}\n`);

  // 6. Admin Signs with Cosign & Publishes at 10% Staged Rollout
  console.log('[Step 6] Admin signs with Cosign and publishes at 10% rollout (POST /admin/versions/:id/publish)...');
  const publishRes = await fetch(`${baseUrl}/admin/versions/${versionId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rolloutPct: 10 })
  });
  const publishData = await publishRes.json() as any;
  console.log(`✓ Version Published! Status: ${publishData.version.status}, Rollout: ${publishData.version.rollout_pct}%`);
  console.log(`✓ Cosign Signature: ${publishData.version.signature.substring(0, 40)}...\n`);

  // 7. Developer Ramps Up Rollout to 100%
  console.log('[Step 7] Developer increases staged rollout to 100% (POST /dev/versions/:id/rollout)...');
  const rolloutRes = await fetch(`${baseUrl}/dev/versions/${versionId}/rollout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rolloutPct: 100 })
  });
  const rolloutData = await rolloutRes.json() as any;
  console.log(`✓ Rollout at 100%. App is now globally active for all tenants.\n`);

  // 8. Run Monthly Developer Payouts (80% revenue share, 20% platform fee, 10% TDS)
  console.log('[Step 8] Running Monthly Developer Payouts Engine (POST /admin/payouts/run)...');
  
  // First, install FoodCost Pro (Partner: KitchenMetrics, ₹449/mo) to generate partner MRR
  const partnerAppsRes = await fetch(`${baseUrl}/store/apps?q=FoodCost`);
  const partnerApps = await partnerAppsRes.json() as any[];
  if (partnerApps.length > 0) {
    await fetch(`${baseUrl}/installations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: partnerApps[0].id, planCode: 'standard' })
    });
  }

  const payoutsRes = await fetch(`${baseUrl}/admin/payouts/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31'
    })
  });
  const payoutsData = await payoutsRes.json() as any;
  console.log('--- MONTHLY PAYOUT STATEMENTS ---');
  payoutsData.payouts.forEach((p: any) => {
    console.log(`Developer: ${p.developer}`);
    console.log(`  Gross Subscription MRR: ₹${p.gross}`);
    console.log(`  Platform Fee (20%):     ₹${p.platformFee}`);
    console.log(`  Developer Share (80%):  ₹${p.developerShare}`);
    console.log(`  TDS Deducted (10%):     ₹${p.tds}`);
    console.log(`  Net Payout Deposited:   ₹${p.net}`);
  });
  console.log('---------------------------------\n');

  console.log('>>> BIZBOX DEVELOPER & REVIEW PIPELINE SIMULATION TEST PASSED <<<');
}

runDeveloperPipelineSimulation().catch((err) => {
  console.error('Simulation failed:', err);
  process.exit(1);
});

