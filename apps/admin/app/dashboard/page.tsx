'use client';
import React, { useState, useEffect } from 'react';
import { API_URL, STORE_URL, CONSOLE_URL, DEV_URL, ADMIN_URL } from '../config';

interface MetricsData {
  listed_apps: number;
  active_installs: number;
  mrr: string;
  pending_reviews: number;
  category_distribution: Array<{ category: string; installs: number }>;
  top_apps: Array<{ name: string; category: string; slug: string; installs: number; est_mrr: string }>;
}

export default function DashboardPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/admin/metrics`)
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load metrics:', err);
        setLoading(false);
      });
  }, []);

  const defaultCategoryData = [
    { label: 'Sales & POS', count: 8800, color: '#4338ca' },
    { label: 'Kitchen', count: 5200, color: '#0e7490' },
    { label: 'Inventory', count: 4100, color: '#15803d' },
    { label: 'Online orders', count: 3600, color: '#c2410c' },
    { label: 'Analytics', count: 2800, color: '#a21caf' },
    { label: 'Finance & GST', count: 2100, color: '#b45309' },
    { label: 'Staff', count: 1500, color: '#b91c1c' },
    { label: 'Marketing', count: 900, color: '#be185d' }
  ];

  const maxVal = 8800;

  return (
    <div style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', color: '#0f172a', minHeight: '100vh' }}>
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
        @media (max-width: 860px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: inline-flex !important; }
          .dash-main { padding: 1.25rem 1rem !important; }
          .dash-kpis-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-two-col { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 520px) {
          .dash-kpis-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 861px) {
          .nav-mobile-btn { display: none !important; }
          .nav-mobile-drawer { display: none !important; }
        }
      `}</style>
      {/* Light Navbar */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 1.5rem',
        minHeight: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <a href={STORE_URL} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>BizBox</span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              color: '#ec4899',
              backgroundColor: '#fdf2f8',
              border: '1px solid #fbcfe8',
              padding: '1px 6px',
              borderRadius: '4px'
            }}>Apps</span>
          </a>
          <nav className="nav-desktop" style={{ display: 'flex', gap: '0.5rem' }}>
            <a href={STORE_URL} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Store</a>
            <a href={`${STORE_URL}/services`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Services Hub</a>
            <a href={`${CONSOLE_URL}/apps`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>My Apps</a>
            <a href={DEV_URL} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Developer</a>
            <a href={DEV_URL} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Publish</a>
            <div style={{ height: '16px', width: '1px', backgroundColor: '#e2e8f0', margin: '0 0.25rem' }} />
            <a href={`${ADMIN_URL}/review-queue`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              Review queue
              <span style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: '999px' }}>1</span>
            </a>
            <a href={`${ADMIN_URL}/dashboard`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none' }}>Dashboard</a>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#ec4899', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>F</div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>FlutterFlirt Admin</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Store team</div>
            </div>
          </div>
          <button
            className="nav-mobile-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              padding: '0.4rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '1.1rem',
              cursor: 'pointer',
              color: '#0f172a'
            }}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="nav-mobile-drawer" style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '1rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <a href={STORE_URL} style={{ padding: '0.5rem', borderRadius: '6px', color: '#0f172a', fontWeight: 500, textDecoration: 'none' }}>Store</a>
          <a href={`${STORE_URL}/services`} style={{ padding: '0.5rem', borderRadius: '6px', color: '#0f172a', fontWeight: 500, textDecoration: 'none' }}>Services Hub</a>
          <a href={`${CONSOLE_URL}/apps`} style={{ padding: '0.5rem', borderRadius: '6px', color: '#0f172a', fontWeight: 500, textDecoration: 'none' }}>Merchant Console (My Apps)</a>
          <a href={DEV_URL} style={{ padding: '0.5rem', borderRadius: '6px', color: '#0f172a', fontWeight: 500, textDecoration: 'none' }}>Developer Console</a>
          <a href={`${ADMIN_URL}/review-queue`} style={{ padding: '0.5rem', borderRadius: '6px', color: '#0f172a', fontWeight: 500, textDecoration: 'none' }}>Admin Review Queue</a>
          <a href={`${ADMIN_URL}/dashboard`} style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 700, textDecoration: 'none' }}>Admin Dashboard</a>
        </div>
      )}

      {/* Main Container (from PDF Page 16 - Bottom Right) */}
      <main className="dash-main" style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#0f172a' }}>App Store dashboard</h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Live view of the BizBox App Store across all businesses. <span style={{ color: '#0284c7', cursor: 'pointer' }}>View data</span>
          </p>
        </div>

        {/* 4 KPIs */}
        <div className="dash-kpis-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
                <div className="skeleton" style={{ width: '60%', height: '10px', marginBottom: '0.85rem' }} />
                <div className="skeleton" style={{ width: '45%', height: '28px', marginBottom: '0.5rem' }} />
                <div className="skeleton" style={{ width: '70%', height: '10px' }} />
              </div>
            ))
          ) : (
            <>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>Listed apps</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>
                  {metrics?.listed_apps || 22}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>20 first-party • 2 partner</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>Active installs</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>
                  {metrics?.active_installs?.toLocaleString() || '18,963'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#16a34a' }}>+ 4.1% this month</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>App billing / month</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>
                  ₹{metrics?.mrr || '89.7L'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Gross MRR incl. GST</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>Pending reviews</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>
                  {metrics?.pending_reviews || 1}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Target decision in 24 hrs</div>
              </div>
            </>
          )}
        </div>

        {/* Installs by Category (Bar Chart) & Top Earning Apps */}
        <div className="dash-two-col" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem' }}>
          {/* Bar Chart Container */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 1.5rem 0', color: '#0f172a' }}>
              Installs by category
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(metrics?.category_distribution && metrics.category_distribution.length > 0
                ? metrics.category_distribution.map((cat, idx) => ({
                    label: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
                    count: Number(cat.installs),
                    color: ['#4338ca', '#0e7490', '#15803d', '#c2410c', '#a21caf', '#b45309', '#b91c1c', '#be185d'][idx % 8]
                  }))
                : defaultCategoryData
              ).map((cat) => {
                const effectiveMax = metrics?.category_distribution && metrics.category_distribution.length > 0
                  ? Math.max(...metrics.category_distribution.map(c => Number(c.installs) || 1))
                  : maxVal;
                const widthPct = Math.min(100, Math.max(10, (cat.count / effectiveMax) * 100));
                return (
                  <div key={cat.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#475569', minWidth: '95px', textAlign: 'right' }}>
                      {cat.label}
                    </span>
                    <div style={{ flex: 1, height: '22px', backgroundColor: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${widthPct}%`,
                        backgroundColor: '#3b82f6',
                        borderRadius: '6px',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', minWidth: '45px' }}>
                      {cat.count.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Earning Apps */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 1.5rem 0', color: '#0f172a' }}>
              Top earning apps
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(metrics?.top_apps && metrics.top_apps.length > 0
                ? metrics.top_apps.map((app, idx) => ({
                    name: app.name,
                    mrr: `₹${Number(app.est_mrr || 0).toLocaleString()}`,
                    color: ['#4338ca', '#0369a1', '#15803d', '#7e22ce', '#0e7490', '#b45309'][idx % 6]
                  }))
                : [
                    { name: 'POS & Billing', mrr: '₹19.5L', color: '#4338ca' },
                    { name: 'Self-Order Kiosk', mrr: '₹14.2L', color: '#0369a1' },
                    { name: 'WhatsApp Marketing', mrr: '₹12.1L', color: '#15803d' },
                    { name: 'CRM & Loyalty', mrr: '₹10.4L', color: '#7e22ce' },
                    { name: 'Kitchen Display', mrr: '₹9.8L', color: '#0e7490' },
                    { name: 'TallyBridge', mrr: '₹7.1L', color: '#b45309' }
                  ]
              ).map((app) => (
                <div key={app.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: app.color }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{app.name}</span>
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{app.mrr}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
