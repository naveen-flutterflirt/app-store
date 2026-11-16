'use client';
import React, { useState, useEffect } from 'react';
import { API_URL, STORE_URL, ADMIN_URL } from '../config';
import { useAuthGuard } from '../useAuthGuard';
import { PageSkeleton } from '../components/PageSkeleton';
import { AdminHeader } from '../components/AdminHeader';

interface MetricsData {
  listed_apps: number;
  active_installs: number;
  mrr: string;
  pending_reviews: number;
  category_distribution: Array<{ category: string; installs: number }>;
  top_apps: Array<{ name: string; category: string; slug: string; installs: number; est_mrr: string }>;
}

export default function DashboardPage() {
  const { authorized, checking } = useAuthGuard('admin');
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authorized) return;
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
  }, [authorized]);

  if (checking || !authorized) {
    return (
      <PageSkeleton
        title="Admin Control Center"
        subtitle="Verifying cryptographic tokens and reviewer security clearances..."
      />
    );
  }

  // Real categories with non-zero or active distribution
  const categoryList = (metrics?.category_distribution || []).map(cat => ({
    label: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
    count: Number(cat.installs) || 0
  }));

  const maxVal = Math.max(1, ...(categoryList.map(c => c.count)));

  return (
    <div style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', backgroundColor: '#faf5f8', color: '#0f172a', minHeight: '100vh' }}>
      <style>{`
        /* Smooth scrolling container without visible scrollbar */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Header */}
      <AdminHeader currentTab="metrics" />

      {/* Main Container */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.25rem 1.75rem' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0 0 0.35rem 0', color: '#0f172a', letterSpacing: '-0.025em' }}>
              App Store Ecosystem Analytics
            </h1>
            <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748b' }}>
              Real-time platform telemetry synced with PostgreSQL database & live merchant installations.
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              fetch(`${API_URL}/admin/metrics`).then(r => r.json()).then(d => { setMetrics(d); setLoading(false); });
            }}
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: '10px',
              border: '1px solid #fbcfe8',
              backgroundColor: '#ffffff',
              color: '#db2777',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            ↻ Refresh Metrics
          </button>
        </div>

        {/* 4 Connected Real KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.25rem' }}>
          {/* Card 1: Listed apps */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fffbfd 100%)',
            border: '1px solid #fbcfe8',
            borderRadius: '18px',
            padding: '1.4rem 1.5rem',
            boxShadow: '0 4px 16px rgba(236, 72, 153, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                Catalog Apps (Live)
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
                {metrics?.listed_apps ?? 0}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 700, marginTop: '0.45rem' }}>
                ✓ Listed in public store
              </div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fdf2f8', border: '1px solid #fbcfe8', color: '#db2777', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              📱
            </div>
          </div>

          {/* Card 2: Active Installs */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fffbfd 100%)',
            border: '1px solid #fbcfe8',
            borderRadius: '18px',
            padding: '1.4rem 1.5rem',
            boxShadow: '0 4px 16px rgba(236, 72, 153, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                Active POS Installs
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
                {metrics?.active_installs ?? 0}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 700, marginTop: '0.45rem' }}>
                ⚡ Connected terminal outlets
              </div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              🏪
            </div>
          </div>

          {/* Card 3: Monthly Revenue */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fffbfd 100%)',
            border: '1px solid #fbcfe8',
            borderRadius: '18px',
            padding: '1.4rem 1.5rem',
            boxShadow: '0 4px 16px rgba(236, 72, 153, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                Monthly Gross MRR
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
                ₹{metrics?.mrr || '0'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#db2777', fontWeight: 700, marginTop: '0.45rem' }}>
                💰 Live active billing plans
              </div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fdf2f8', border: '1px solid #fbcfe8', color: '#ec4899', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              💳
            </div>
          </div>

          {/* Card 4: Pending Reviews */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fffbfd 100%)',
            border: '1px solid #fbcfe8',
            borderRadius: '18px',
            padding: '1.4rem 1.5rem',
            boxShadow: '0 4px 16px rgba(236, 72, 153, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                Pending Review Queue
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
                {metrics?.pending_reviews ?? 0}
              </div>
              <div style={{ fontSize: '0.74rem', color: (metrics?.pending_reviews || 0) > 0 ? '#b45309' : '#16a34a', fontWeight: 700, marginTop: '0.45rem' }}>
                {(metrics?.pending_reviews || 0) > 0 ? '⚠️ Awaiting auditor decision' : '✓ All submissions reviewed'}
              </div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              🛡️
            </div>
          </div>
        </div>

        {/* 2-Column Analytics Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
          {/* Installs by Category with Clean Scrollable Feed */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #fbcfe8',
            borderRadius: '20px',
            padding: '1.75rem',
            boxShadow: '0 4px 20px rgba(236, 72, 153, 0.04)'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: '0 0 1.25rem 0', color: '#0f172a', letterSpacing: '-0.01em' }}>
              Installs by Category ({categoryList.length})
            </h3>
            
            <div className="no-scrollbar" style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.9rem', paddingRight: '4px' }}>
              {categoryList.map((cat, i) => {
                const pct = Math.max(8, Math.round((cat.count / maxVal) * 100));
                return (
                  <div key={cat.label} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', minWidth: '100px' }}>
                      {cat.label}
                    </span>
                    <div style={{ flex: 1, height: '14px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #ec4899 0%, #f43f5e 100%)',
                        borderRadius: '999px',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', minWidth: '35px', textAlign: 'right' }}>
                      {cat.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Earning & Active Apps with Smooth Hidden Scrollbar */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #fbcfe8',
            borderRadius: '20px',
            padding: '1.75rem',
            boxShadow: '0 4px 20px rgba(236, 72, 153, 0.04)'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: '0 0 1.25rem 0', color: '#0f172a', letterSpacing: '-0.01em' }}>
              Top Applications by Revenue & Installs
            </h3>

            {(!metrics?.top_apps || metrics.top_apps.length === 0) ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                No active applications recorded.
              </div>
            ) : (
              <div className="no-scrollbar" style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '4px' }}>
                {metrics.top_apps.map((app, idx) => (
                  <div key={app.name} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    backgroundColor: '#fdf2f8',
                    border: '1px solid #fbcfe8'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #fbcfe8',
                        color: '#db2777',
                        fontWeight: 900,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        #{idx + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>{app.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Category: <span style={{ textTransform: 'capitalize' }}>{app.category}</span> • {app.installs} active installs
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a' }}>
                        ₹{Number(app.est_mrr || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 700 }}>monthly MRR</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
