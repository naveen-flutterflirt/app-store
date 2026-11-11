'use client';

import React, { useState, useEffect } from 'react';
import { API_URL, STORE_URL, CONSOLE_URL, DEV_URL, ADMIN_URL } from '../config';

interface ServiceInfo {
  id: string;
  name: string;
  title: string;
  role: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  port: number;
  url: string;
  iconSvg: React.ReactNode;
  description: string;
  features: string[];
  specs: { label: string; value: string }[];
  tag: string;
  bgGradient: string;
  accentBorder: string;
}

export default function ServicesHubPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState<Record<string, 'checking' | 'online' | 'offline'>>({
    store: 'checking',
    console: 'checking',
    developer: 'checking',
    review: 'checking',
    dashboard: 'checking',
    api: 'checking'
  });

  const services: ServiceInfo[] = [
    {
      id: 'store',
      name: 'Storefront',
      title: 'BizBox App Storefront',
      role: 'Merchant / Discover',
      badge: 'Marketplace',
      badgeColor: '#ec4899',
      badgeBg: '#fdf2f8',
      badgeBorder: '#fbcfe8',
      port: 3000,
      url: STORE_URL,
      iconSvg: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      ),
      description: 'Discover, search, and install point-of-sale applications with 14-day trials, UPI AutoPay, and 18% GST invoicing.',
      features: ['28+ Launch Apps Catalog', 'Category Filters & Fast Search', '5-Step Dynamic Install Modal', 'SAC 997331 GST Breakdown'],
      specs: [
        { label: 'Port', value: '3000' },
        { label: 'Theme', value: 'Light / PDF Page 15' },
        { label: 'Audience', value: 'Store Owners' }
      ],
      tag: 'Customer-Facing',
      bgGradient: 'linear-gradient(135deg, rgba(236,72,153,0.06) 0%, rgba(99,102,241,0.04) 100%)',
      accentBorder: '#ec4899'
    },
    {
      id: 'console',
      name: 'Merchant Console',
      title: 'Device & Installed Apps',
      role: 'Hardware / Edge Host',
      badge: 'Edge Host',
      badgeColor: '#3b82f6',
      badgeBg: '#eff6ff',
      badgeBorder: '#bfdbfe',
      port: 3001,
      url: `${CONSOLE_URL}/apps`,
      iconSvg: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      ),
      description: 'Monitor BizBox Edge hardware telemetry (CPU, RAM, Storage, Heartbeat) and manage installed tenant microservices.',
      features: ['Raspberry Pi 5 Telemetry', 'Active Installations Table', '30-Day Retained Data Uninstalls', 'Dynamic Status & Scopes'],
      specs: [
        { label: 'Port', value: '3001' },
        { label: 'Edge ID', value: 'BizBox-BLR01' },
        { label: 'Audience', value: 'Outlet Staff' }
      ],
      tag: 'Hardware Monitor',
      bgGradient: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(14,165,233,0.04) 100%)',
      accentBorder: '#3b82f6'
    },
    {
      id: 'developer',
      name: 'Developer Console',
      title: 'Partner Portal & CI Pipeline',
      role: 'ISV Developer',
      badge: 'CI / Release',
      badgeColor: '#10b981',
      badgeBg: '#ecfdf5',
      badgeBorder: '#a7f3d0',
      port: 3002,
      url: DEV_URL,
      iconSvg: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
      ),
      description: 'Track developer KPIs (Installs, MRR, Rating, Payouts), submit bundle versions, and run 6 automated CI checks.',
      features: ['Live Developer KPI Cards', '6 Automated CI Verification Checks', 'Presigned S3 Bundles', 'Staged Rollout Manager'],
      specs: [
        { label: 'Port', value: '3002' },
        { label: 'Split', value: '80% Revenue Share' },
        { label: 'Audience', value: 'App Developers' }
      ],
      tag: 'Partner Portal',
      bgGradient: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(20,184,166,0.04) 100%)',
      accentBorder: '#10b981'
    },
    {
      id: 'review',
      name: 'Admin Review Queue',
      title: 'Security & Cosign Approval',
      role: 'FlutterFlirt Admin',
      badge: 'Audit & Sign',
      badgeColor: '#f59e0b',
      badgeBg: '#fffbeb',
      badgeBorder: '#fde68a',
      port: 3003,
      url: `${ADMIN_URL}/review-queue`,
      iconSvg: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polyline points="9 11 12 14 22 4"/>
        </svg>
      ),
      description: 'Audit submitted versions against 4-point checklists, trigger cryptographic Cosign signing, and control canary rollouts.',
      features: ['Automated Check Inspect', '4-Point Review Checklist', 'Cryptographic Cosign Signing', '10%–100% Staged Rollout Slider'],
      specs: [
        { label: 'Port', value: '3003' },
        { label: 'Signing', value: 'Cosign Sigstore' },
        { label: 'Audience', value: 'App Reviewers' }
      ],
      tag: 'Gatekeeper',
      bgGradient: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(234,88,12,0.04) 100%)',
      accentBorder: '#f59e0b'
    },
    {
      id: 'dashboard',
      name: 'Admin Dashboard',
      title: 'Platform Analytics & Payouts',
      role: 'Platform Owner',
      badge: 'Analytics',
      badgeColor: '#8b5cf6',
      badgeBg: '#f5f3ff',
      badgeBorder: '#ddd6fe',
      port: 3003,
      url: `${ADMIN_URL}/dashboard`,
      iconSvg: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      ),
      description: 'Platform health monitoring, category installation breakdown charts, top earning apps leaderboard, and monthly payouts.',
      features: ['Total Listed Apps KPI', 'Category Distribution Chart', 'Top Earning Leaderboard', '80/20 & 10% TDS Payout Engine'],
      specs: [
        { label: 'Port', value: '3003' },
        { label: 'Tax', value: '10% Section 194J TDS' },
        { label: 'Audience', value: 'Executives / Finance' }
      ],
      tag: 'Executive Suite',
      bgGradient: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(168,85,247,0.04) 100%)',
      accentBorder: '#8b5cf6'
    },
    {
      id: 'api',
      name: 'API Reference',
      title: 'REST Gateway & OpenAPI Specs',
      role: 'Core Backend',
      badge: '51 Endpoints',
      badgeColor: '#06b6d4',
      badgeBg: '#ecfeff',
      badgeBorder: '#a5f3fc',
      port: 3000,
      url: `${STORE_URL}/api-docs`,
      iconSvg: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      ),
      description: 'Interactive documentation for all 51 OpenAPI endpoints with live request tester and Neon PostgreSQL schemas.',
      features: ['51 OpenAPI 3.0 Endpoints', 'Interactive Live Request Inspector', 'Razorpay Webhook Listeners', 'Stateless Edge Daemon Sync'],
      specs: [
        { label: 'Port', value: '4000' },
        { label: 'Docs', value: 'Interactive' },
        { label: 'Audience', value: 'Developers / POS' }
      ],
      tag: 'Developer Hub',
      bgGradient: 'linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(14,165,233,0.04) 100%)',
      accentBorder: '#06b6d4'
    }
  ];

  useEffect(() => {
    const endpoints: Record<string, string> = {
      store: STORE_URL,
      console: `${CONSOLE_URL}/apps`,
      developer: DEV_URL,
      review: `${ADMIN_URL}/review-queue`,
      dashboard: `${ADMIN_URL}/dashboard`,
      api: `${API_URL}/store/apps`
    };

    Object.entries(endpoints).forEach(([key, url]) => {
      fetch(url, { mode: 'no-cors' })
        .then(() => {
          setHealthStatus(prev => ({ ...prev, [key]: 'online' }));
        })
        .catch(() => {
          setHealthStatus(prev => ({ ...prev, [key]: 'offline' }));
        });
    });
  }, []);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', color: '#0f172a', minHeight: '100vh' }}>
      <style>{`
        @media (max-width: 860px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: inline-flex !important; }
          .hero-title { font-size: 1.8rem !important; }
          .hero-banner { padding: 2rem 1rem 2.5rem !important; }
          .services-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 861px) {
          .nav-mobile-btn { display: none !important; }
          .nav-mobile-drawer { display: none !important; }
        }
      `}</style>

      {/* Light Theme Navbar */}
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
            <a href={`${STORE_URL}/services`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none' }}>Services Hub</a>
            <a href={`${CONSOLE_URL}/apps`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>My Apps</a>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a
            href={`${CONSOLE_URL}/login`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.35rem 0.75rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              textDecoration: 'none'
            }}
          >
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0ea5e9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>B</div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>Brew Street Cafe</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Console Sign In →</div>
            </div>
          </a>
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
          <a href={`${STORE_URL}/services`} style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 700, textDecoration: 'none' }}>Services Hub</a>
          <a href={`${CONSOLE_URL}/apps`} style={{ padding: '0.5rem', borderRadius: '6px', color: '#0f172a', fontWeight: 500, textDecoration: 'none' }}>Merchant Console (My Apps)</a>
          <a href={`${CONSOLE_URL}/login`} style={{ padding: '0.5rem', borderRadius: '6px', color: '#0284c7', fontWeight: 600, textDecoration: 'none' }}>Console Sign In →</a>
        </div>
      )}

      {/* Hero Banner */}
      <div className="hero-banner" style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        padding: '3rem 2rem 3.5rem',
        color: '#ffffff',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow Spheres */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '10%',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.45) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-60px',
          left: '10%',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '850px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            backgroundColor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '1rem',
            border: '1px solid rgba(255,255,255,0.25)'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ade80' }} />
            BizBox Platform Services Directory · Production Architecture
          </div>

          <h1 className="hero-title" style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '0.75rem',
            lineHeight: 1.15
          }}>
            Platform Services Hub & Navigation
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: 'rgba(255,255,255,0.9)',
            maxWidth: '650px',
            margin: '0 auto 1.5rem',
            lineHeight: 1.5
          }}>
            Click any service card below to navigate directly to its dedicated dashboard, inspect live telemetry, test workflows, and manage the ecosystem.
          </p>

          {/* Quick status bar */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1.5rem',
            backgroundColor: 'rgba(15,23,42,0.4)',
            backdropFilter: 'blur(12px)',
            padding: '0.6rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.15)',
            fontSize: '0.82rem'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
              <strong>6 / 6</strong> Microservices Active
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
            <span>Neon Serverless PG 18.6</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
            <span>Razorpay Test Subscriptions</span>
          </div>
        </div>
      </div>

      {/* Main Services Grid */}
      <main style={{ maxWidth: '1240px', margin: '-1.75rem auto 4rem', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
        <div className="services-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {services.map((svc) => {
            const isOnline = healthStatus[svc.id] === 'online';

            return (
              <a
                key={svc.id}
                href={svc.url}
                target={svc.port !== 3000 ? '_blank' : undefined}
                rel="noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  textDecoration: 'none',
                  color: 'inherit',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)';
                  e.currentTarget.style.borderColor = svc.accentBorder;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                {/* Header background band */}
                <div style={{
                  padding: '1.5rem 1.5rem 1rem',
                  background: svc.bgGradient,
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      border: `1px solid ${svc.badgeBorder}`,
                      color: svc.badgeColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                    }}>
                      {svc.iconSvg}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {svc.role}
                      </div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0.1rem 0 0', lineHeight: 1.2 }}>
                        {svc.name}
                      </h2>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: svc.badgeColor,
                      backgroundColor: svc.badgeBg,
                      border: `1px solid ${svc.badgeBorder}`,
                      padding: '2px 8px',
                      borderRadius: '9999px'
                    }}>
                      {svc.badge}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      color: isOnline ? '#16a34a' : '#d97706',
                      fontWeight: 600
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: isOnline ? '#22c55e' : '#f59e0b'
                      }} />
                      {isOnline ? 'Active' : 'Checking'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <p style={{
                    fontSize: '0.88rem',
                    color: '#475569',
                    lineHeight: 1.5,
                    marginBottom: '1.25rem'
                  }}>
                    {svc.description}
                  </p>

                  {/* Feature Highlights */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      Key Capabilities
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {svc.features.map((feat, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: '#334155' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Specs Pill Matrix */}
                  <div style={{
                    marginTop: 'auto',
                    paddingTop: '1rem',
                    borderTop: '1px solid #f1f5f9',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    textAlign: 'center'
                  }}>
                    {svc.specs.map((sp, idx) => (
                      <div key={idx} style={{ backgroundColor: '#f8fafc', padding: '0.4rem 0.25rem', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{sp.label}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {sp.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Link Footer */}
                  <div style={{
                    marginTop: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    transition: 'background-color 0.15s ease'
                  }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>Open {svc.name}</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>({svc.url.replace('http://', '')})</span>
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        padding: '2rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: '#64748b'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>
            BizBox App Store &bull; FlutterFlirt Private Limited
          </div>
          <div>
            Built with Next.js 14, Node.js API Gateway, Neon PostgreSQL 18.6, and Razorpay Subscriptions (UPI AutoPay).
          </div>
        </div>
      </footer>
    </div>
  );
}
