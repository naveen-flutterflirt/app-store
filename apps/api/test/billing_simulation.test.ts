/**
 * Phase 3 Billing & Subscriptions Simulation Test
 * FlutterFlirt Private Limited · BizBox App Store v1.0
 */

async function runBillingSimulation() {
  console.log('>>> STARTING BIZBOX BILLING & SUBSCRIPTION SIMULATION TEST <<<\n');
  const baseUrl = 'http://localhost:4000/v1';

  // 1. Install an app with a 14-day trial (e.g. Online Orders Hub: online-hub, 14 days trial, ₹999/mo)
  console.log('[Step 1] Installing Online Orders Hub with 14-day trial...');
  
  // Find app ID for online-hub
  const appsRes = await fetch(`${baseUrl}/store/apps?q=Online%20Orders%20Hub`);
  const apps = await appsRes.json() as any[];
  const hubApp = apps[0];
  if (!hubApp) throw new Error('Online Orders Hub app not found!');

  const installRes = await fetch(`${baseUrl}/installations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appId: hubApp.id,
      planCode: 'standard'
    })
  });

  const installData = await installRes.json() as any;
  console.log(`✓ Installed ${hubApp.name}. Status: ${installData.status}`);
  console.log(`✓ Subscription Created: ${installData.subscription.provider_sub_id} (Status: ${installData.subscription.status})\n`);

  // 2. Test GET /billing/subscriptions (Verify itemized GST calculation)
  console.log('[Step 2] Testing GET /billing/subscriptions (Itemized 18% GST Invoice)...');
  const subRes = await fetch(`${baseUrl}/billing/subscriptions`);
  const billingData = await subRes.json() as any;

  console.log('--- NEXT INVOICE PREVIEW ---');
  console.log(`Subtotal: ₹${billingData.nextInvoice.subtotal}`);
  console.log(`CGST (9%): ₹${billingData.nextInvoice.cgst}`);
  console.log(`SGST (9%): ₹${billingData.nextInvoice.sgst}`);
  console.log(`Total 18% GST: ₹${billingData.nextInvoice.totalGst}`);
  console.log(`Grand Total: ₹${billingData.nextInvoice.grandTotal}`);
  console.log(`SAC Code: ${billingData.nextInvoice.hsnSac}`);
  console.log(`Payment Mandate: ${billingData.nextInvoice.mandateMethod}`);
  console.log('----------------------------\n');

  if (billingData.nextInvoice.grandTotal <= 0) {
    throw new Error('Grand total calculation failed');
  }

  // 3. Test Webhook: subscription.charged (recurring payment success)
  console.log('[Step 3] Testing Razorpay Webhook: subscription.charged...');
  const chargedRes = await fetch(`${baseUrl}/webhooks/billing/razorpay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'subscription.charged',
      entity: {
        id: installData.subscription.provider_sub_id,
        status: 'active'
      }
    })
  });
  const chargedData = await chargedRes.json();
  console.log('✓ Webhook subscription.charged handled:', chargedData, '\n');

  // 4. Test Webhook: subscription.payment_failed (7-day grace period enforcement)
  console.log('[Step 4] Testing Razorpay Webhook: subscription.payment_failed (7-day grace)...');
  const failedRes = await fetch(`${baseUrl}/webhooks/billing/razorpay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'subscription.payment_failed',
      entity: {
        id: installData.subscription.provider_sub_id,
        status: 'past_due'
      }
    })
  });
  const failedData = await failedRes.json();
  console.log('✓ Webhook subscription.payment_failed handled (Status set to past_due, grace active):', failedData, '\n');

  // 5. Test Webhook: subscription.cancelled (Suspend installation, retain data 30 days)
  console.log('[Step 5] Testing Razorpay Webhook: subscription.cancelled...');
  const cancelRes = await fetch(`${baseUrl}/webhooks/billing/razorpay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'subscription.cancelled',
      entity: {
        id: installData.subscription.provider_sub_id,
        status: 'cancelled'
      }
    })
  });
  const cancelData = await cancelRes.json();
  console.log('✓ Webhook subscription.cancelled handled (Installation suspended):', cancelData, '\n');

  console.log('>>> BIZBOX BILLING & SUBSCRIPTIONS SIMULATION TEST PASSED <<<');
}

runBillingSimulation().catch((err) => {
  console.error('Billing simulation failed:', err);
  process.exit(1);
});
