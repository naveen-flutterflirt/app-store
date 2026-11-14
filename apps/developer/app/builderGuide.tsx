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
      title: 'Choose Runtime Architecture',
      desc: 'BizBox apps run inside the POS Browser (Cloud), on the local restaurant hardware (Edge ARM64 on Raspberry Pi 5), or bridge both (Hybrid).',
      badge: 'Step 1: Architecture',
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginTop: '1.25rem' }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #fbcfe8',
            borderRadius: '16px',
            padding: '1.4rem',
            boxShadow: '0 4px 16px -4px rgba(236, 72, 153, 0.08)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: '0.85rem' }}>
              ☁️
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>Cloud (Browser Only)</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
              Runs inside sandboxed iframe on the Cashier POS screen. Ideal for loyalty programs, discounts, customer feedback, and table reservations.
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.4rem',
            boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.04)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: '0.85rem' }}>
              ⚡
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>Edge (Raspberry Pi 5)</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
              Runs inside lightweight k3s container locally. Direct USB/LAN access to thermal receipt printers, weighing scales, and kitchen screens. 256MB RAM limit.
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            border: '2px solid #ec4899',
            borderRadius: '16px',
            padding: '1.4rem',
            boxShadow: '0 8px 24px -6px rgba(236, 72, 153, 0.16)',
            position: 'relative'
          }}>
            <div style={{ position: 'absolute', top: '-10px', right: '14px', backgroundColor: '#ec4899', color: '#ffffff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase' }}>
              Recommended
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: '0.85rem' }}>
              🔄
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>Hybrid Architecture</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
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
      desc: 'Use our official client SDK to interact with POS hardware, listen for real-time kitchen tickets, and apply cashier actions.',
      badge: 'Step 3: SDK Integration',
      code: `// 1. Install official SDK
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
      {/* Header Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #311042 100%)',
        color: '#ffffff',
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: '0 20px 40px -15px rgba(236, 72, 153, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '750px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(236, 72, 153, 0.2)', border: '1px solid rgba(236, 72, 153, 0.4)', borderRadius: '999px', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700, color: '#f472b6', marginBottom: '1rem' }}>
            <span>🛠️ Official Developer Kit</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.75rem 0', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            Developer Builder Guide & POS SDK Quickstart
          </h2>
          <p style={{ margin: 0, fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.6 }}>
            Build, test, and distribute commercial enterprise applications for 10,000+ Indian restaurants, cafes, and retail chains running BizBox POS & Edge Hardware.
          </p>

          <div style={{ display: 'flex', gap: '0.85rem', marginTop: '1.75rem', flexWrap: 'wrap' }}>
            <a
              href="https://github.com/naveen-flutterflirt/app-store"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '12px',
                backgroundColor: '#ec4899',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(236, 72, 153, 0.35)'
              }}
            >
              <span>📦 Clone Starter Repo on GitHub ↗</span>
            </a>
            <div style={{
              padding: '0.65rem 1.15rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#f8fafc',
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ color: '#ec4899' }}>$</span> npm install @bizbox/sdk
            </div>
          </div>
        </div>
      </div>

      {/* Step by Step Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {steps.map((st, idx) => (
          <div
            key={st.num}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: '0 4px 20px -6px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  backgroundColor: '#fdf2f8',
                  border: '1px solid #fbcfe8',
                  color: '#ec4899',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.95rem'
                }}>
                  {st.num}
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  {st.title}
                </h3>
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#475569',
                padding: '4px 12px',
                borderRadius: '999px'
              }}>
                {st.badge}
              </span>
            </div>

            <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
              {st.desc}
            </p>

            {st.content}

            {st.code && (
              <div style={{ position: 'relative', marginTop: '1rem' }}>
                <pre style={{
                  backgroundColor: '#0f172a',
                  color: '#38bdf8',
                  padding: '1.4rem',
                  borderRadius: '14px',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  margin: 0,
                  lineHeight: 1.6,
                  border: '1px solid #1e293b'
                }}>
                  {st.code}
                </pre>
                <button
                  onClick={() => copyCode(st.code!, idx)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {copiedIndex === idx ? '✓ Copied' : 'Copy Code'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
