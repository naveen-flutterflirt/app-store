'use client';
import React, { useState, useEffect } from 'react';
import { API_URL, STORE_URL, CONSOLE_URL, DEV_URL, ADMIN_URL } from '../../config';

interface InstalledApp {
  id: string;
  app_name: string;
  package_id: string;
  slug: string;
  runtime: string;
  category?: string;
  status: string;
  plan_name: string;
  price_month: string;
  current_version: string;
  auto_update?: boolean;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  sales: { bg: '#e0e7ff', text: '#4338ca', label: 'POS' },
  kitchen: { bg: '#cffafe', text: '#0e7490', label: 'KDS' },
  inventory: { bg: '#dcfce7', text: '#15803d', label: 'INV' },
  customers: { bg: '#f3e8ff', text: '#7e22ce', label: 'CRM' },
  finance: { bg: '#fef3c7', text: '#b45309', label: 'GST' },
  people: { bg: '#fee2e2', text: '#b91c1c', label: 'HR' },
  devices: { bg: '#e0f2fe', text: '#0369a1', label: 'DEV' },
  analytics: { bg: '#fae8ff', text: '#a21caf', label: 'BI' },
  marketing: { bg: '#fce7f3', text: '#be185d', label: 'WA' },
  industry: { bg: '#f1f5f9', text: '#334155', label: 'IND' },
  online: { bg: '#ffedd5', text: '#c2410c', label: 'QR' },
  ai: { bg: '#ede9fe', text: '#6d28d9', label: 'AI' }
};

export default function MyAppsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [runtimeFilter, setRuntimeFilter] = useState<'all' | 'edge' | 'hybrid' | 'cloud'>('all');
  const [syncingEdge, setSyncingEdge] = useState(false);
  const [lastSyncText, setLastSyncText] = useState('12 s ago');
  const [appToUninstall, setAppToUninstall] = useState<InstalledApp | null>(null);
  const [uninstalling, setUninstalling] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [overnightUpdates, setOvernightUpdates] = useState(true);

  // Authenticated business owner state
  const [user, setUser] = useState<{ name: string; email: string; role: string }>({
    name: 'Aarav Sharma',
    email: 'owner@brewstreet.com',
    role: 'owner'
  });
  const [tenant, setTenant] = useState<{ name: string; businessType: string; activeApps?: number }>({
    name: 'Brew Street Cafe',
    businessType: 'cafe'
  });

  const fetchInstallations = () => {
    fetch(`${API_URL}/installations`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setApps(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load installations:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    // Check localStorage session or set default
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('bizbox_user');
      const storedTenant = localStorage.getItem('bizbox_tenant');
      if (storedUser) {
        try { setUser(JSON.parse(storedUser)); } catch (e) {}
      }
      if (storedTenant) {
        try { setTenant(JSON.parse(storedTenant)); } catch (e) {}
      }
    }
    fetchInstallations();
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bizbox_token');
      localStorage.removeItem('bizbox_user');
      localStorage.removeItem('bizbox_tenant');
      window.location.href = '/login';
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSyncEdgeNode = async () => {
    setSyncingEdge(true);
    await new Promise(r => setTimeout(r, 600));
    setLastSyncText('Just now');
    setSyncingEdge(false);
    showToast('Edge node BLR01 state synchronized with NGS NATS broker.', 'success');
  };

  const handleToggleAutoUpdate = async (appId: string, currentVal: boolean) => {
    const newVal = !currentVal;
    setApps(prev => prev.map(a => a.id === appId ? { ...a, auto_update: newVal } : a));
    try {
      await fetch(`${API_URL}/installations/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoUpdate: newVal })
      });
      showToast(`Auto-updates ${newVal ? 'enabled' : 'disabled'} for app.`, 'success');
    } catch (e: any) {
      showToast(`Failed to update setting: ${e.message}`, 'error');
    }
  };

  const handleConfirmUninstall = async () => {
    if (!appToUninstall) return;
    setUninstalling(true);
    try {
      const res = await fetch(`${API_URL}/installations/${appToUninstall.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setApps(prev => prev.filter(a => a.id !== appToUninstall.id));
        showToast(`"${appToUninstall.app_name}" uninstalled. Data retained for 30 days.`, 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`Error uninstalling: ${err.message || 'Server error'}`, 'error');
      }
    } catch (e: any) {
      showToast(`Network error: ${e.message}`, 'error');
    } finally {
      setUninstalling(false);
      setAppToUninstall(null);
    }
  };

  // Filtered Apps
  const filteredApps = apps.filter(app => {
    const matchesSearch = app.app_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.package_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRuntime = runtimeFilter === 'all' || app.runtime.toLowerCase() === runtimeFilter;
    return matchesSearch && matchesRuntime;
  });

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
          .console-main { padding: 1.25rem 1rem !important; }
          .edge-health-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 1rem !important; width: 100% !important; margin-top: 0.75rem !important; }
        }
        @media (min-width: 861px) {
          .nav-mobile-btn { display: none !important; }
          .nav-mobile-drawer { display: none !important; }
          .edge-health-grid { display: flex !important; gap: 2rem !important; align-items: center !important; }
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
              color: '#3b82f6',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '1px 6px',
              borderRadius: '4px'
            }}>Console</span>
          </a>
          <nav className="nav-desktop" style={{ display: 'flex', gap: '0.5rem' }}>
            <a href={STORE_URL} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Store</a>
            <a href={`${STORE_URL}/services`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Services Hub</a>
            <a href={`${CONSOLE_URL}/apps`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none' }}>My Apps</a>
            <a href={DEV_URL} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Developer</a>
            <a href={DEV_URL} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Publish</a>
            <div style={{ height: '16px', width: '1px', backgroundColor: '#e2e8f0', margin: '0 0.25rem' }} />
            <a href={`${ADMIN_URL}/review-queue`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              Review queue
              <span style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: '999px' }}>1</span>
            </a>
            <a href={`${ADMIN_URL}/dashboard`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Dashboard</a>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0ea5e9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
              {tenant.name.slice(0, 1)}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{tenant.name}</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{user.name} ({user.role})</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#dc2626',
              cursor: 'pointer'
            }}
            title="Sign out of Business Owner console"
          >
            Sign Out
          </button>
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
          <a href={`${CONSOLE_URL}/apps`} style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 700, textDecoration: 'none' }}>Merchant Console (My Apps)</a>
          <a href={DEV_URL} style={{ padding: '0.5rem', borderRadius: '6px', color: '#0f172a', fontWeight: 500, textDecoration: 'none' }}>Developer Console</a>
          <a href={`${ADMIN_URL}/review-queue`} style={{ padding: '0.5rem', borderRadius: '6px', color: '#0f172a', fontWeight: 500, textDecoration: 'none' }}>Admin Review Queue</a>
          <a href={`${ADMIN_URL}/dashboard`} style={{ padding: '0.5rem', borderRadius: '6px', color: '#0f172a', fontWeight: 500, textDecoration: 'none' }}>Admin Dashboard</a>
        </div>
      )}

      {/* Main Container */}
      <main className="console-main" style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: '#0f172a' }}>My Apps</h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Apps installed for Brew Street Cafe. Updates install automatically overnight unless turned off.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '0.4rem 0.85rem', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Overnight auto-updates:</span>
            <button
              onClick={() => {
                setOvernightUpdates(!overnightUpdates);
                showToast(`Overnight auto-updates ${!overnightUpdates ? 'enabled' : 'disabled'}.`);
              }}
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: overnightUpdates ? '#dcfce7' : '#f1f5f9',
                color: overnightUpdates ? '#15803d' : '#64748b',
                cursor: 'pointer'
              }}
            >
              {overnightUpdates ? '✓ Enabled' : 'Paused'}
            </button>
          </div>
        </div>

        {/* Box Health Banner (Dark Navy container exactly as pictured in PDF Page 15) */}
        <section style={{
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          padding: '1.5rem 2rem',
          color: '#ffffff',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>BizBox Edge – BLR01</span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: '#065f46',
                color: '#34d399'
              }}>● online</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Raspberry Pi 5 · 16 GB · 512 GB · platform 1.4.2 · online
            </div>
          </div>

          <div className="edge-health-grid">
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem' }}>CPU</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8' }}>38%</div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem' }}>Memory</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8' }}>5.2 / 16 GB</div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem' }}>Storage</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8' }}>38 / 512 GB</div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem' }}>Last sync</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399' }}>{lastSyncText}</div>
            </div>
            <button
              onClick={handleSyncEdgeNode}
              disabled={syncingEdge}
              style={{
                backgroundColor: '#1e293b',
                color: '#ffffff',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '0.45rem 0.8rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: syncingEdge ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              {syncingEdge ? 'Syncing...' : '↻ Sync Node'}
            </button>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {(['all', 'edge', 'hybrid', 'cloud'] as const).map(f => (
              <button
                key={f}
                onClick={() => setRuntimeFilter(f)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  border: runtimeFilter === f ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  backgroundColor: runtimeFilter === f ? '#0f172a' : '#ffffff',
                  color: runtimeFilter === f ? '#ffffff' : '#64748b',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {f === 'all' ? `All Apps (${apps.length})` : (f === 'edge' ? '⚡ Edge' : (f === 'hybrid' ? '🔄 Hybrid' : '☁ Cloud'))}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <input
              type="text"
              placeholder="Search installed apps..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.85rem 0.45rem 2rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
            <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}>
              🔍
            </span>
          </div>
        </div>

        {/* Table of Installed Apps */}
        <section style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>App</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Version</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Runs on</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Plan</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
                        <div style={{ flex: 1 }}>
                          <div className="skeleton" style={{ width: '120px', height: '14px', marginBottom: '0.3rem' }} />
                          <div className="skeleton" style={{ width: '80px', height: '10px' }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div className="skeleton" style={{ width: '40px', height: '12px' }} />
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div className="skeleton" style={{ width: '70px', height: '12px' }} />
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div className="skeleton" style={{ width: '90px', height: '12px' }} />
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div className="skeleton" style={{ width: '60px', height: '18px', borderRadius: '999px' }} />
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div className="skeleton" style={{ width: '120px', height: '26px', display: 'inline-block', borderRadius: '6px' }} />
                    </td>
                  </tr>
                ))
              ) : filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
                    {searchQuery ? `No installed apps matching "${searchQuery}"` : 'No apps installed yet.'}{' '}
                    <a href={STORE_URL} style={{ color: '#0284c7', fontWeight: 600 }}>Browse Store</a>
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const catKey = (app.category || 'sales').toLowerCase();
                  const catBadge = CATEGORY_COLORS[catKey] || { bg: '#e0e7ff', text: '#4338ca', label: 'APP' };

                  return (
                    <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            backgroundColor: catBadge.bg,
                            color: catBadge.text,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.7rem'
                          }}>
                            {catBadge.label}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{app.app_name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{app.package_id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: '#475569' }}>
                        v{app.current_version || '1.0.0'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: '#475569', textTransform: 'capitalize' }}>
                        {app.runtime === 'edge' ? '⚡ BizBox box' : (app.runtime === 'hybrid' ? '🔄 Box + Cloud' : '☁ Cloud')}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: '#475569' }}>
                        {app.plan_name ? `${app.plan_name} (₹${app.price_month}/mo)` : 'Standard'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '999px',
                          backgroundColor: app.status === 'active' ? '#dcfce7' : '#fee2e2',
                          color: app.status === 'active' ? '#15803d' : '#b91c1c'
                        }}>
                          ● {app.status === 'active' ? 'Running' : app.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                          <a
                            href={`/x/${app.package_id}`}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              backgroundColor: '#0284c7',
                              color: '#ffffff',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                              boxShadow: '0 1px 3px rgba(2, 132, 199, 0.2)'
                            }}
                          >
                            Launch ↗
                          </a>
                          <a
                            href={`${STORE_URL}/apps/${app.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                              color: '#0f172a',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textDecoration: 'none'
                            }}
                          >
                            Store
                          </a>
                          <button
                            onClick={() => setAppToUninstall(app)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              border: '1px solid #fee2e2',
                              backgroundColor: '#fff5f5',
                              color: '#b91c1c',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Uninstall
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: toast.type === 'error' ? '#7f1d1d' : '#0f172a',
          border: toast.type === 'error' ? '1px solid #b91c1c' : '1px solid #334155',
          color: '#ffffff',
          padding: '0.85rem 1.4rem',
          borderRadius: '10px',
          fontSize: '0.85rem',
          fontWeight: 500,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          zIndex: 300
        }}>
          <span style={{ color: toast.type === 'error' ? '#fca5a5' : '#10b981', fontWeight: 800 }}>
            {toast.type === 'error' ? '✕' : '✓'}
          </span>
          {toast.message}
        </div>
      )}

      {/* Custom Modal for Uninstall Confirmation (replacing native browser confirm) */}
      {appToUninstall && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 250
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '2rem',
            width: '440px',
            maxWidth: '92vw',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: 700
              }}>
                ⚠️
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Uninstall {appToUninstall.app_name}?
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {appToUninstall.package_id}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
              Are you sure you want to uninstall this application? Your tenant data and configurations will be retained for <strong>30 days</strong> per data retention policy before permanent removal.
            </p>

            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              fontSize: '0.78rem',
              color: '#64748b'
            }}>
              Active subscriptions will be canceled immediately and any scheduled edge deployment tasks will be terminated.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                disabled={uninstalling}
                onClick={() => setAppToUninstall(null)}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                disabled={uninstalling}
                onClick={handleConfirmUninstall}
                style={{
                  padding: '0.6rem 1.3rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: uninstalling ? '#94a3b8' : '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: uninstalling ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
                }}
              >
                {uninstalling ? 'Uninstalling...' : 'Yes, Uninstall'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
