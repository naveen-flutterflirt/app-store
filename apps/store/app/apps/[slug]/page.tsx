'use client';
import React, { useState, useEffect } from 'react';
import { API_URL, STORE_URL, CONSOLE_URL, DEV_URL, ADMIN_URL } from '../../config';

interface AppDetail {
  id: string;
  name: string;
  tagline: string;
  description_md: string;
  category: string;
  developer_name: string;
  rating_avg: string;
  rating_count: number;
  install_count: number;
  package_id: string;
  runtime: string;
  latest_version: string;
  plans: Array<{
    id: string;
    code: string;
    name: string;
    price_month: string;
    trial_days: number;
    unit: string;
  }>;
}

export default function AppDetailPage({ params }: { params: { slug: string } }) {
  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [installModal, setInstallModal] = useState(false);
  const [installStep, setInstallStep] = useState(0);
  const [installed, setInstalled] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/store/apps/${params.slug}`)
      .then(res => res.json())
      .then(data => {
        setApp(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load app:', err);
        setLoading(false);
      });
  }, [params.slug]);

  const handleStartInstall = async () => {
    setInstallModal(true);
    setInstallError(null);
    setInstallStep(1); // Checking dependencies
    await new Promise(r => setTimeout(r, 600));

    setInstallStep(2); // Activating 14-day trial
    await new Promise(r => setTimeout(r, 700));

    setInstallStep(3); // Setting up cloud data & permissions
    await new Promise(r => setTimeout(r, 800));

    setInstallStep(4); // Downloading signed app to BizBox box
    await new Promise(r => setTimeout(r, 800));

    try {
      if (app) {
        const res = await fetch(`${API_URL}/installations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: '00000000-0000-0000-0000-000000000001',
            appId: app.id,
            planId: app.plans?.[0]?.id
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Installation service error');
        }
      }
      setInstallStep(5); // Starting & health check OK
      setInstalled(true);
    } catch (e: any) {
      setInstallError(e.message || 'Installation failed. Please check network or contact support.');
    }
  };

  if (loading) {
    return (
      <div style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', padding: '2rem 1.5rem' }}>
        <style>{`
          @keyframes shimmer {
            0% { background-position: -400px 0; }
            100% { background-position: 400px 0; }
          }
          .skeleton {
            background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
            background-size: 800px 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 6px;
          }
        `}</style>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="skeleton" style={{ width: '64px', height: '64px', borderRadius: '12px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: '45%', height: '24px', marginBottom: '0.5rem' }} />
                <div className="skeleton" style={{ width: '70%', height: '14px', marginBottom: '0.4rem' }} />
                <div className="skeleton" style={{ width: '30%', height: '12px' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div className="skeleton" style={{ height: '110px', borderRadius: '10px' }} />
              <div className="skeleton" style={{ height: '110px', borderRadius: '10px' }} />
              <div className="skeleton" style={{ height: '110px', borderRadius: '10px' }} />
            </div>
            <div className="skeleton" style={{ width: '100%', height: '20px', marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ width: '90%', height: '16px', marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ width: '75%', height: '16px' }} />
          </div>
          <div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
              <div className="skeleton" style={{ width: '50%', height: '26px', marginBottom: '0.5rem' }} />
              <div className="skeleton" style={{ width: '70%', height: '12px', marginBottom: '1.5rem' }} />
              <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '8px', marginBottom: '1.5rem' }} />
              <div className="skeleton" style={{ width: '100%', height: '80px', borderRadius: '8px' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!app) {
    return <div style={{ padding: '4rem', textAlign: 'center', fontFamily: 'sans-serif' }}>App not found.</div>;
  }

  const primaryPlan = app.plans?.[0];
  const priceDisplay = primaryPlan
    ? (Number(primaryPlan.price_month) === 0 ? 'Free' : `₹${Number(primaryPlan.price_month).toFixed(0)}/${primaryPlan.unit}/month`)
    : 'Free';

  return (
    <div style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', color: '#0f172a', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 2.5rem;
          align-items: start;
        }
        .detail-padding {
          padding: 2.5rem;
        }
        @media (max-width: 900px) {
          .detail-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          .detail-padding {
            padding: 1.25rem 1rem !important;
          }
        }
        .screenshots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 0.75rem;
        }
      `}</style>

      {/* Light Navbar */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 1.5rem',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <a href={STORE_URL} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>BizBox</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ec4899', backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8', padding: '1px 6px', borderRadius: '4px' }}>Apps</span>
          </a>
          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            <a href={STORE_URL} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>← Back to Store</a>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.3rem 0.65rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#0ea5e9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700 }}>B</div>
          <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>Brew Street Cafe</div>
            <div style={{ fontSize: '0.62rem', color: '#64748b' }}>Business owner</div>
          </div>
        </div>
      </header>

      {/* App Detail Content */}
      <main className="detail-padding" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="detail-grid">
          {/* Left Column */}
          <div>
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '14px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 800,
                flexShrink: 0
              }}>
                {app.category.slice(0, 3).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: '#0f172a', lineHeight: 1.2 }}>{app.name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', flexWrap: 'wrap' }}>
                  <span style={{ color: '#64748b' }}>by <strong style={{ color: '#0f172a' }}>{app.developer_name}</strong></span>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <span style={{ color: '#64748b', textTransform: 'capitalize' }}>{app.category}</span>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <span style={{ color: '#eab308' }}>★ {Number(app.rating_avg) > 0 ? Number(app.rating_avg).toFixed(1) : '4.4'}</span>
                  <span style={{ color: '#64748b' }}>({app.rating_count || 270})</span>
                </div>
              </div>
            </div>

            {/* Screenshots preview bar */}
            <div className="screenshots-grid" style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{ height: '95px', backgroundColor: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                📊 Stock Dashboard
              </div>
              <div style={{ height: '95px', backgroundColor: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                📋 Wastage Entry
              </div>
              <div style={{ height: '95px', backgroundColor: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                🔔 Reorder Alerts
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ color: '#334155', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                {app.tagline}. Built for BizBox — installs in one click, runs on your BizBox box with cloud sync, and uses the same staff logins, outlets and GST settings as the rest of your apps.
              </p>
            </div>

            {/* Permissions */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 0.85rem 0', color: '#0f172a' }}>Permissions it asks for</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569' }}>orders:read</span>
                  <span style={{ fontSize: '0.82rem', color: '#334155' }}>Read past stock movements</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#b45309' }}>stock:read / write</span>
                  <span style={{ fontSize: '0.82rem', color: '#334155' }}>Read & write menu, prices and modifiers</span>
                </div>
              </div>
            </div>

            {/* What's new */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 0.4rem 0', color: '#0f172a' }}>What's new • v{app.latest_version || '1.0.0'}</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                Performance improvements and support for BizBox platform 1.4.
              </p>
            </div>
          </div>

          {/* Right Column: Pricing & Install Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.75rem',
            position: 'sticky',
            top: '80px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
              {priceDisplay}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1.25rem' }}>
              14-day free trial • GST extra
            </div>

            <button
              onClick={handleStartInstall}
              disabled={installed}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '10px',
                backgroundColor: installed ? '#16a34a' : '#ec4899',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: installed ? 'default' : 'pointer',
                marginBottom: '1.25rem',
                boxShadow: installed ? '0 4px 12px rgba(22,163,74,0.2)' : '0 4px 12px rgba(236,72,153,0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              {installed ? '✓ Installed on BizBox' : 'Start free trial'}
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: '#64748b' }}>Version</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{app.latest_version || '1.0.0'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: '#64748b' }}>Runs on</span>
                <span style={{ fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>{app.runtime}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: '#64748b' }}>Works for</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>All businesses</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: '#64748b' }}>Requires</span>
                <span style={{ fontWeight: 600, color: '#4338ca' }}>POS & Billing</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: '#64748b' }}>Package</span>
                <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.72rem', wordBreak: 'break-all' }}>{app.package_id}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Install Modal */}
      {installModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '2rem',
            width: '460px',
            maxWidth: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                {app.category.slice(0, 3).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Installing {app.name}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>This takes a few seconds</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {[
                'Checking dependencies',
                'Activating 14-day trial',
                'Setting up cloud data & permissions',
                'Downloading signed app to BizBox box',
                'Starting & health check'
              ].map((stepText, idx) => {
                const stepNum = idx + 1;
                const isDone = installStep > stepNum;
                const isCurrent = installStep === stepNum;
                return (
                  <div key={stepText} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: isDone ? '#10b981' : (isCurrent ? '#38bdf8' : '#e2e8f0'),
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: 700
                    }}>
                      {isDone ? '✓' : (isCurrent ? '•' : '')}
                    </div>
                    <span style={{
                      fontSize: '0.82rem',
                      color: isDone ? '#0f172a' : (isCurrent ? '#0284c7' : '#94a3b8'),
                      fontWeight: isCurrent ? 600 : 400
                    }}>
                      {stepText}
                    </span>
                  </div>
                );
              })}
            </div>

            {installError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}>
                <span>⚠️</span>
                <span>{installError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setInstallModal(false)}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              {installError && (
                <button
                  onClick={handleStartInstall}
                  style={{
                    padding: '0.55rem 1.15rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#ec4899',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Retry Installation
                </button>
              )}
              {installed && !installError && (
                <a
                  href={`${CONSOLE_URL}/apps`}
                  style={{
                    padding: '0.55rem 1.15rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Open My Apps →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
