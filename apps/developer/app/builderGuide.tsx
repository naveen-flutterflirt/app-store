'use client';
import React, { useState } from 'react';

export function DeveloperBuilderGuide() {
  const [selectedLanguage, setSelectedLanguage] = useState<'react' | 'nodejs' | 'python'>('react');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const steps = [
    {
      num: 1,
      title: 'Choose Runtime Model Architecture',
      desc: 'BizBox apps run either inside the POS Browser (Cloud), on the local restaurant hardware (Edge ARM64 on Raspberry Pi 5), or seamlessly bridge both (Hybrid).',
      badge: 'Step 1: Architecture',
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>☁️</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>Cloud (Browser Only)</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
              Runs inside sandboxed iframe on the Cashier POS screen. Ideal for loyalty programs, discounts, customer feedback, and table reservations.
            </div>
          </div>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>⚡</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>Edge (Raspberry Pi 5)</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
              Runs inside lightweight k3s container locally. Direct USB/LAN access to thermal receipt printers, weighing scales, and kitchen screens. 256MB RAM limit.
            </div>
          </div>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>🔄</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>Hybrid (Recommended)</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
              Cloud dashboard for reporting paired with local edge daemon for offline order dispatch and hardware control.
            </div>
          </div>
        </div>
      )
    },
    {
      num: 2,
      title: 'Generate bizbox-app.json Manifest',
      desc: 'Every app package must have a valid bizbox-app.json file at its root. This defines permissions, UI mounting slots, and security boundaries.',
      badge: 'Step 2: Manifest Schema',
      code: `{
  "id": "in.developer.loyalty-hub",
  "name": "Loyalty & Cashback Hub",
  "version": "1.0.0",
  "runtime": "cloud",
  "minPlatform": "1.4.0",
  "ui": {
    "entry": "/index.html",
    "slots": [
      "pos.checkout.action",
      "console.dashboard.widget"
    ]
  },
  "scopes": [
    { "scope": "orders:read", "reason": "Calculate loyalty rewards from order total" },
    { "scope": "customers:pii", "reason": "Identify member customer by phone number" }
  ]
}`
    },
    {
      num: 3,
      title: 'Install & Call BizBox Bridge SDK',
      desc: 'Use our official client SDK to interact with the POS hardware, fetch real-time orders, and emit custom events.',
      badge: 'Step 3: SDK Integration',
      code: `// 1. Install SDK
npm install @bizbox/sdk

// 2. Initialize in your React / Next.js app
import { BizBox } from '@bizbox/sdk';

// Listen to active live order events from Cashier
BizBox.on('order:created', async (order) => {
  console.log('New Order placed at Table:', order.tableNumber);
  console.log('Total Bill Amount (₹):', order.totalAmount);

  // Send loyalty rewards discount back to POS
  await BizBox.pos.applyDiscount({
    orderId: order.id,
    type: 'points_redemption',
    amount: 50.00
  });
});`
    },
    {
      num: 4,
      title: 'Local Testing & Packaging with BizBox CLI',
      desc: 'Bundle your code into an encrypted .tgz package and test locally before uploading.',
      badge: 'Step 4: CLI & Build',
      code: `# 1. Scaffold a fresh template
npx @bizbox/cli create my-restaurant-app

# 2. Test locally in simulated POS environment
npm run dev

# 3. Build & bundle for submission
npx @bizbox/cli build --target=production
# Output generated: dist/bundle.tgz + bizbox-app.json

# 4. Upload to Internal Testing track
# (Use the "+ Release" button on Developer Console dashboard)`
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div style={{
        backgroundColor: '#0f172a',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '2rem',
        backgroundImage: 'radial-gradient(circle at top right, rgba(236, 72, 153, 0.25), transparent)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🛠️</span>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Developer Builder Guide & SDK Quickstart
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8', maxWidth: '720px', lineHeight: 1.6 }}>
          Learn how to build, test, and publish professional business applications for 10,000+ Indian restaurants and retail outlets running on the BizBox platform.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <a
            href="https://github.com/naveen-flutterflirt/app-store"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              backgroundColor: '#ec4899',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            📦 Clone Starter Repo on GitHub ↗
          </a>
          <div style={{
            padding: '0.55rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#f8fafc',
            fontFamily: 'monospace'
          }}>
            npm install @bizbox/sdk
          </div>
        </div>
      </div>

      {/* Step by Step Walkthrough */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {steps.map((st, idx) => (
          <div
            key={st.num}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1.75rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#fdf2f8',
                  border: '1px solid #fbcfe8',
                  color: '#ec4899',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}>
                  {st.num}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  {st.title}
                </h3>
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                backgroundColor: '#f1f5f9',
                color: '#475569',
                padding: '3px 10px',
                borderRadius: '999px'
              }}>
                {st.badge}
              </span>
            </div>

            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
              {st.desc}
            </p>

            {st.content}

            {st.code && (
              <div style={{ position: 'relative', marginTop: '0.75rem' }}>
                <pre style={{
                  backgroundColor: '#0f172a',
                  color: '#38bdf8',
                  padding: '1.25rem',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  margin: 0,
                  lineHeight: 1.6
                }}>
                  {st.code}
                </pre>
                <button
                  onClick={() => copyCode(st.code!, idx)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {copiedIndex === idx ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
