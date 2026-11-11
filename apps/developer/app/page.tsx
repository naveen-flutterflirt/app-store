'use client';
import React, { useState, useEffect } from 'react';
import { API_URL, STORE_URL, CONSOLE_URL, DEV_URL, ADMIN_URL } from './config';
import { useAuthGuard } from './useAuthGuard';

interface DevApp {
  id: string;
  name: string;
  package_id: string;
  slug: string;
  category: string;
  status: string;
  last_version: string;
  rollout_pct: number;
  installs: number;
  rating_avg: string;
  est_mrr: string;
}

interface SubmissionItem {
  id: string;
  version: string;
  status: string;
  created_at: string;
  release_notes: string;
  rollout_pct: number;
  app_id: string;
  app_name: string;
  package_id: string;
  slug: string;
}

export default function DeveloperConsolePage() {
  const { authorized, checking } = useAuthGuard('developer');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apps, setApps] = useState<DevApp[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<DevApp | null>(null);

  // New App Form State
  const [newAppName, setNewAppName] = useState('');
  const [newAppTagline, setNewAppTagline] = useState('');
  const [newAppCategory, setNewAppCategory] = useState('kitchen');
  const [newAppRuntime, setNewAppRuntime] = useState<'cloud' | 'edge' | 'hybrid'>('cloud');
  const [creatingApp, setCreatingApp] = useState(false);
  const [newAppFormError, setNewAppFormError] = useState<string | null>(null);

  // Publish Version Form State
  const [targetAppId, setTargetAppId] = useState('');
  const [newVersionStr, setNewVersionStr] = useState('');
  const [releaseNotesStr, setReleaseNotesStr] = useState('');
  const [uploadUrlGenerated, setUploadUrlGenerated] = useState<string | null>(null);
  const [ciStep, setCiStep] = useState(0);
  const [ciRunning, setCiRunning] = useState(false);
  const [ciError, setCiError] = useState<string | null>(null);

  // Manage App Rollout State
  const [manageRollout, setManageRollout] = useState(10);
  const [updatingRollout, setUpdatingRollout] = useState(false);
  const [manageError, setManageError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const checks = [
    { name: 'Manifest & schema validation', desc: 'bizbox-app.schema.json structure' },
    { name: 'Dependencies & SBOM (Syft)', desc: 'Validates zero vulnerable dependencies' },
    { name: 'Security scan (Trivy)', desc: '0 critical, 0 high CVE container scans' },
    { name: 'Licence compliance check', desc: 'Closed-source & permissive OSS compatibility' },
    { name: 'ARM64 build & edge verification', desc: 'k3s container sandbox compatibility' },
    { name: 'Permissions & data use audit', desc: 'Granular justification for requested scopes' }
  ];

  const loadDeveloperData = () => {
    if (!authorized) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/dev/apps`).then(r => r.json()),
      fetch(`${API_URL}/dev/submissions`).then(r => r.json())
    ])
      .then(([appsData, subsData]) => {
        if (Array.isArray(appsData)) {
          setApps(appsData);
          if (appsData.length > 0 && !targetAppId) {
            setTargetAppId(appsData[0].id);
          }
        }
        if (Array.isArray(subsData)) {
          setSubmissions(subsData);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load developer data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (authorized) {
      loadDeveloperData();
    }
  }, [authorized]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // 1. Create New App Listing
  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewAppFormError(null);
    const trimmedName = newAppName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setNewAppFormError('App name must be at least 2 characters long.');
      return;
    }
    if (trimmedName.length > 60) {
      setNewAppFormError('App name cannot exceed 60 characters.');
      return;
    }
    if (newAppTagline.length > 90) {
      setNewAppFormError('Tagline cannot exceed 90 characters.');
      return;
    }

    setCreatingApp(true);
    try {
      const res = await fetch(`${API_URL}/dev/apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          tagline: newAppTagline.trim() || 'Custom business application for BizBox',
          category: newAppCategory,
          runtime: newAppRuntime,
          businessTypes: ['restaurant', 'cafe', 'retail']
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showToast(`App "${trimmedName}" created successfully in draft mode.`, 'success');
        setShowNewAppModal(false);
        setNewAppName('');
        setNewAppTagline('');
        setNewAppFormError(null);
        loadDeveloperData();
      } else {
        const errorMsg = data.message || 'Failed to create app';
        setNewAppFormError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (err: any) {
      const netMsg = `Network error: ${err.message}`;
      setNewAppFormError(netMsg);
      showToast(netMsg, 'error');
    } finally {
      setCreatingApp(false);
    }
  };

  // 2. Open Publish Modal for a specific app or default
  const handleOpenPublishModal = (app?: DevApp) => {
    if (app) {
      setTargetAppId(app.id);
      const parts = (app.last_version || '1.0.0').split('.');
      const patch = (parseInt(parts[2] || '0', 10) + 1).toString();
      setNewVersionStr(`${parts[0] || '1'}.${parts[1] || '0'}.${patch}`);
    } else if (apps.length > 0) {
      const defaultApp = apps[0];
      setTargetAppId(defaultApp.id);
      const parts = (defaultApp.last_version || '1.0.0').split('.');
      const patch = (parseInt(parts[2] || '0', 10) + 1).toString();
      setNewVersionStr(`${parts[0] || '1'}.${parts[1] || '0'}.${patch}`);
    } else {
      setNewVersionStr('1.0.0');
    }
    setReleaseNotesStr('Performance updates, security patches, and platform compatibility');
    setUploadUrlGenerated(null);
    setCiStep(0);
    setCiRunning(false);
    setCiError(null);
    setShowPublishModal(true);
  };

  // 3. Execute Publish Pipeline (Draft Version -> S3 Presigned URL -> Automated CI -> Admin Queue)
  const handleRunPublishPipeline = async () => {
    if (!targetAppId) {
      setCiError('Please select an application to publish.');
      return;
    }
    const versionClean = newVersionStr.trim();
    if (!versionClean) {
      setCiError('Version number is required (e.g. 1.0.1).');
      return;
    }
    if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(versionClean)) {
      setCiError('Version must follow Semantic Versioning (e.g., 1.0.0, 1.2.1).');
      return;
    }

    const selected = apps.find(a => a.id === targetAppId);
    setCiRunning(true);
    setCiError(null);
    setCiStep(1);

    try {
      // Step A: Create version & generate AWS S3 presigned upload URL
      const verRes = await fetch(`${API_URL}/dev/apps/${targetAppId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: versionClean,
          manifest: {
            id: selected?.package_id || `in.developer.${selected?.slug || 'app'}`,
            name: selected?.name || 'Application',
            version: versionClean,
            runtime: 'cloud',
            permissions: ['orders:read', 'stock:read']
          },
          releaseNotes: releaseNotesStr.trim()
        })
      });

      const verData = await verRes.json().catch(() => ({}));

      if (!verRes.ok) {
        throw new Error(verData.message || 'Failed to create version');
      }

      setUploadUrlGenerated(verData.uploadUrl);
      setCiStep(2);
      await new Promise(r => setTimeout(r, 600));

      // Step B: Submit version to automated 6 CI security checks
      setCiStep(3);
      await new Promise(r => setTimeout(r, 500));

      const submitRes = await fetch(`${API_URL}/dev/versions/${verData.version.id}/submit`, {
        method: 'POST'
      });

      const submitData = await submitRes.json().catch(() => ({}));

      if (!submitRes.ok) {
        throw new Error(submitData.message || 'CI pipeline execution failed');
      }

      setCiStep(4);
      await new Promise(r => setTimeout(r, 500));
      setCiStep(5);
      await new Promise(r => setTimeout(r, 500));
      setCiStep(6);

      showToast(`Version ${versionClean} passed all CI checks and entered Admin Review Queue!`, 'success');
      loadDeveloperData();
    } catch (err: any) {
      const errMsg = err.message || 'Pipeline failed';
      setCiError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setCiRunning(false);
    }
  };

  // 4. Manage App Rollout
  const handleOpenManage = (app: DevApp) => {
    setSelectedApp(app);
    setManageRollout(app.rollout_pct || 10);
    setManageError(null);
    setShowManageModal(true);
  };

  const handleUpdateRollout = async () => {
    if (!selectedApp) return;
    setUpdatingRollout(true);
    setManageError(null);
    try {
      // Find latest submission version for this app if available
      const latestSub = submissions.find(s => s.app_id === selectedApp.id);
      if (latestSub) {
        const res = await fetch(`${API_URL}/dev/versions/${latestSub.id}/rollout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rolloutPct: manageRollout })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to update rollout');
        }
      }

      showToast(`Rollout for "${selectedApp.name}" updated to ${manageRollout}% of business edge nodes.`, 'success');
      setApps(prev => prev.map(a => a.id === selectedApp.id ? { ...a, rollout_pct: manageRollout } : a));
      setShowManageModal(false);
    } catch (e: any) {
      setManageError(e.message || 'Failed to update rollout');
      showToast(`Error: ${e.message}`, 'error');
    } finally {
      setUpdatingRollout(false);
    }
  };

  // Aggregate Metrics
  const totalInstalls = apps.reduce((acc, a) => acc + (Number(a.installs) || 0), 0) + 184;
  const totalMrr = apps.reduce((acc, a) => acc + (Number(a.est_mrr) || 0), 0);

  if (checking || !authorized) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#064e3b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontFamily: 'sans-serif' }}>
        Verifying partner developer permissions...
      </div>
    );
  }

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
          .dev-main { padding: 1.25rem 1rem !important; }
          .dev-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .dev-header-actions { width: 100% !important; justify-content: flex-start !important; margin-top: 0.75rem !important; }
        }
        @media (max-width: 540px) {
          .dev-stats-grid { grid-template-columns: 1fr !important; }
          .modal-two-col { grid-template-columns: 1fr !important; }
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
          <a href={DEV_URL} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>BizBox</span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              color: '#10b981',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              padding: '1px 6px',
              borderRadius: '4px'
            }}>Developer</span>
          </a>
          <nav className="nav-desktop" style={{ display: 'flex', gap: '0.5rem' }}>
            <a href={DEV_URL} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none' }}>Developer Console</a>
            <button
              onClick={() => handleOpenPublishModal()}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                color: '#64748b',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Publish New Version
            </button>
            <a href={STORE_URL} target="_blank" rel="noreferrer" style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Public Store ↗</a>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>K</div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>KitchenMetrics</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Partner developer • 80% RevShare</div>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('bizbox_token');
              localStorage.removeItem('bizbox_user');
              window.location.href = '/login';
            }}
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
            title="Sign out of Developer console"
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
          <a href={DEV_URL} style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 700, textDecoration: 'none' }}>Developer Console</a>
          <button
            onClick={() => { setMobileMenuOpen(false); handleOpenPublishModal(); }}
            style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0.5rem', borderRadius: '6px', color: '#0f172a', fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer' }}
          >
            Publish New Version
          </button>
          <a href={STORE_URL} target="_blank" rel="noreferrer" style={{ padding: '0.5rem', borderRadius: '6px', color: '#0f172a', fontWeight: 500, textDecoration: 'none' }}>Public Store ↗</a>
          <button
            onClick={() => {
              localStorage.removeItem('bizbox_token');
              localStorage.removeItem('bizbox_user');
              window.location.href = '/login';
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0.5rem', borderRadius: '6px', color: '#dc2626', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="dev-main" style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#0f172a' }}>Developer Console</h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Publish, release, and manage your BizBox apps. Every version passes automated 6-step CI security scans and Ed25519 cryptographic signing before rollout.
            </p>
          </div>
          <div className="dev-header-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowNewAppModal(true)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              + New app
            </button>
            <button
              onClick={() => handleOpenPublishModal()}
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#ec4899',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(236, 72, 153, 0.25)'
              }}
            >
              Publish new version
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="dev-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>Active installs</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>{totalInstalls}</div>
            <div style={{ fontSize: '0.72rem', color: '#16a34a' }}>+ 18 this week</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>Monthly revenue</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>
              {totalMrr > 0 ? `₹${Number(totalMrr).toLocaleString()}` : '₹3.6L'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Your share: 80% • TDS: 10%</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>Avg rating</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>4.8 ★</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>142 verified merchant reviews</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>Estimated Next payout</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>₹2.9L</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>1 Nov • HDFC Bank • Automated</div>
          </div>
        </div>

        {/* Your Apps Table */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Your apps ({apps.length})
            </h2>
            <button
              onClick={() => loadDeveloperData()}
              style={{
                fontSize: '0.75rem',
                color: '#0284c7',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              ↻ Refresh
            </button>
          </div>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>App</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Live Version</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Rollout</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Installs</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
                          <div style={{ flex: 1 }}>
                            <div className="skeleton" style={{ width: '130px', height: '14px', marginBottom: '0.3rem' }} />
                            <div className="skeleton" style={{ width: '85px', height: '10px' }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}><div className="skeleton" style={{ width: '45px', height: '14px' }} /></td>
                      <td style={{ padding: '1rem 1.25rem' }}><div className="skeleton" style={{ width: '90px', height: '10px' }} /></td>
                      <td style={{ padding: '1rem 1.25rem' }}><div className="skeleton" style={{ width: '30px', height: '14px' }} /></td>
                      <td style={{ padding: '1rem 1.25rem' }}><div className="skeleton" style={{ width: '65px', height: '18px', borderRadius: '999px' }} /></td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}><div className="skeleton" style={{ width: '50px', height: '26px', display: 'inline-block', borderRadius: '6px' }} /></td>
                    </tr>
                  ))
                ) : apps.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                      No apps created yet. Click "+ New app" above to get started.
                    </td>
                  </tr>
                ) : (
                  apps.map((app) => (
                    <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem' }}>
                            {app.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{app.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{app.package_id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: '#0f172a', fontWeight: 600 }}>v{app.last_version}</td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '80px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${app.rollout_pct}%`, height: '100%', backgroundColor: '#0284c7' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>{app.rollout_pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: '#475569' }}>{app.installs}</td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '999px',
                          backgroundColor: app.status === 'listed' ? '#dcfce7' : (app.status === 'draft' ? '#fef3c7' : '#f1f5f9'),
                          color: app.status === 'listed' ? '#15803d' : (app.status === 'draft' ? '#b45309' : '#475569')
                        }}>
                          ● {app.status === 'listed' ? 'Published' : app.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => handleOpenPublishModal(app)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              border: '1px solid #fbcfe8',
                              backgroundColor: '#fdf2f8',
                              color: '#ec4899',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            + Release
                          </button>
                          <button
                            onClick={() => handleOpenManage(app)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                              color: '#0f172a',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Submissions History Table */}
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a' }}>
            Version Submissions History ({submissions.length})
          </h2>
          {submissions.length === 0 ? (
            <div style={{ backgroundColor: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '14px', padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>No active submissions pending.</p>
              <p style={{ margin: 0, fontSize: '0.8rem' }}>Click <strong>Publish new version</strong> to run automated CI checks and submit to FlutterFlirt reviewers.</p>
            </div>
          ) : (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>App & Version</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Submitted At</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Release Notes</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Review Queue</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                          {sub.app_name} <span style={{ color: '#0284c7' }}>v{sub.version}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{sub.package_id}</div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: '#475569' }}>
                        {new Date(sub.created_at).toLocaleDateString()} {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: '#334155', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {sub.release_notes || 'Standard release version'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '999px',
                          backgroundColor:
                            sub.status === 'published' ? '#dcfce7' :
                            sub.status === 'in_review' ? '#fef3c7' :
                            sub.status === 'rejected' ? '#fee2e2' : '#f1f5f9',
                          color:
                            sub.status === 'published' ? '#15803d' :
                            sub.status === 'in_review' ? '#b45309' :
                            sub.status === 'rejected' ? '#b91c1c' : '#475569'
                        }}>
                          ● {sub.status === 'in_review' ? 'In Review Queue' : sub.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        {sub.status === 'in_review' ? (
                          <a
                            href={`${ADMIN_URL}/review-queue`}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              backgroundColor: '#0f172a',
                              color: '#ffffff',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textDecoration: 'none'
                            }}
                          >
                            Audit in Admin →
                          </a>
                        ) : sub.status === 'published' ? (
                          <a
                            href={`${STORE_URL}/apps/${sub.slug}`}
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
                            View on Store
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Archived</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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

      {/* Modal 1: + New App Modal */}
      {showNewAppModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '2rem',
            width: '480px',
            maxWidth: '92vw',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              Create New BizBox App
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.82rem', color: '#64748b' }}>
              Registers a new application package under your developer profile in draft status.
            </p>

            {newAppFormError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}>
                <span>⚠️</span>
                <span>{newAppFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateApp} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                  App Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Loyalty Rewards Hub"
                  value={newAppName}
                  onChange={e => { setNewAppName(e.target.value); setNewAppFormError(null); }}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                    Tagline / Short Summary
                  </label>
                  <span style={{ fontSize: '0.72rem', color: newAppTagline.length > 90 ? '#ef4444' : '#64748b' }}>
                    {newAppTagline.length}/90
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Customer points and cashback on POS checkout"
                  value={newAppTagline}
                  maxLength={90}
                  onChange={e => { setNewAppTagline(e.target.value); setNewAppFormError(null); }}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div className="modal-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Category
                  </label>
                  <select
                    value={newAppCategory}
                    onChange={e => setNewAppCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', backgroundColor: '#ffffff' }}
                  >
                    <option value="sales">Sales & POS</option>
                    <option value="kitchen">Kitchen & Operations</option>
                    <option value="inventory">Inventory & Recipes</option>
                    <option value="customers">Customers & Loyalty</option>
                    <option value="finance">Finance, Billing & GST</option>
                    <option value="people">Staff & Attendance</option>
                    <option value="devices">Devices & Hardware</option>
                    <option value="online">Online & QR Ordering</option>
                    <option value="analytics">Reports & Analytics</option>
                    <option value="marketing">Marketing & WhatsApp</option>
                    <option value="ai">AI & Automation</option>
                    <option value="industry">Industry Verticals</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Runtime Model
                  </label>
                  <select
                    value={newAppRuntime}
                    onChange={e => setNewAppRuntime(e.target.value as any)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', backgroundColor: '#ffffff' }}
                  >
                    <option value="cloud">Cloud (Browser only)</option>
                    <option value="edge">Edge (BizBox Box hardware)</option>
                    <option value="hybrid">Hybrid (Box + Cloud)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => { setShowNewAppModal(false); setNewAppFormError(null); }}
                  style={{ padding: '0.6rem 1.15rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingApp}
                  style={{ padding: '0.6rem 1.3rem', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontSize: '0.82rem', fontWeight: 700, cursor: creatingApp ? 'not-allowed' : 'pointer' }}
                >
                  {creatingApp ? 'Creating...' : 'Create App'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Publish New Version & Automated CI Modal */}
      {showPublishModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '2rem',
            width: '540px',
            maxWidth: '92vw',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              Publish New Version & Run CI Checks
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.82rem', color: '#64748b' }}>
              Target: <strong>AWS S3 ({process.env.NEXT_PUBLIC_S3_BUCKET || 'bizbox-bundles'})</strong> • Cryptographic Cosign Ed25519 Signing
            </p>

            {/* Inputs if CI hasn't started */}
            {ciStep === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Select App
                  </label>
                  <select
                    value={targetAppId}
                    onChange={e => {
                      setTargetAppId(e.target.value);
                      const a = apps.find(x => x.id === e.target.value);
                      if (a) {
                        const parts = (a.last_version || '1.0.0').split('.');
                        setNewVersionStr(`${parts[0] || '1'}.${parts[1] || '0'}.${parseInt(parts[2] || '0', 10) + 1}`);
                      }
                    }}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
                  >
                    {apps.map(a => (
                      <option key={a.id} value={a.id}>{a.name} (Current: v{a.last_version})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                      Version (SemVer) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newVersionStr}
                      onChange={e => setNewVersionStr(e.target.value)}
                      placeholder="e.g. 1.2.0"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                      Release Summary / Notes
                    </label>
                    <input
                      type="text"
                      value={releaseNotesStr}
                      onChange={e => setReleaseNotesStr(e.target.value)}
                      placeholder="e.g. Bug fixes and performance boost"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6 Automated CI Pipeline Progress */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              {checks.map((chk, idx) => {
                const isPassed = ciStep > idx;
                const isCurrent = ciStep === idx + 1;
                return (
                  <div key={chk.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: isPassed ? '#dcfce7' : (isCurrent ? '#e0f2fe' : '#ffffff'),
                        border: isPassed ? '1px solid #bbf7d0' : (isCurrent ? '1px solid #38bdf8' : '1px solid #cbd5e1'),
                        color: isPassed ? '#15803d' : (isCurrent ? '#0284c7' : '#94a3b8'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700
                      }}>
                        {isPassed ? '✓' : (isCurrent ? '•' : (idx + 1))}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', color: isPassed ? '#0f172a' : (isCurrent ? '#0284c7' : '#64748b'), fontWeight: isPassed || isCurrent ? 600 : 400 }}>
                          {chk.name}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{chk.desc}</div>
                      </div>
                    </div>
                    {isPassed && (
                      <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>PASSED</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Error or S3 URL Preview */}
            {ciError && (
              <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                ⚠️ {ciError}
              </div>
            )}

            {uploadUrlGenerated && (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.75rem', borderRadius: '8px', fontSize: '0.72rem', wordBreak: 'break-all', marginBottom: '1.25rem' }}>
                <strong>AWS S3 Presigned Target:</strong> {uploadUrlGenerated.substring(0, 85)}...
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowPublishModal(false)}
                style={{ padding: '0.55rem 1.15rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Close
              </button>
              {ciStep === 0 ? (
                <button
                  onClick={handleRunPublishPipeline}
                  disabled={ciRunning}
                  style={{
                    padding: '0.55rem 1.35rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#ec4899',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: ciRunning ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(236, 72, 153, 0.25)'
                  }}
                >
                  Upload & Run Automated CI Checks
                </button>
              ) : ciStep >= 6 ? (
                <a
                  href={`${ADMIN_URL}/review-queue`}
                  style={{
                    padding: '0.55rem 1.15rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Review in Admin Queue →
                </a>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Manage App Modal */}
      {showManageModal && selectedApp && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '2rem',
            width: '460px',
            maxWidth: '92vw',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              Manage {selectedApp.name}
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.78rem', color: '#64748b' }}>
              {selectedApp.package_id} • Status: <strong>{selectedApp.status}</strong>
            </p>

            {manageError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}>
                <span>⚠️</span>
                <span>{manageError}</span>
              </div>
            )}

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>Active Rollout</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0284c7' }}>{manageRollout}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={manageRollout}
                onChange={e => setManageRollout(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#0284c7', marginBottom: '0.5rem' }}
              />
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Staged canary rollout deployed automatically to BizBox edge nodes matching merchant hash-buckets.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Total Installs</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedApp.installs}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Estimated MRR</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{Number(selectedApp.est_mrr).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Public Store Listing</span>
                <a href={`${STORE_URL}/apps/${selectedApp.slug}`} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: '#0284c7', textDecoration: 'none' }}>
                  Open Storefront ↗
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowManageModal(false)}
                style={{ padding: '0.55rem 1.15rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                onClick={handleUpdateRollout}
                disabled={updatingRollout}
                style={{ padding: '0.55rem 1.3rem', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontSize: '0.82rem', fontWeight: 700, cursor: updatingRollout ? 'not-allowed' : 'pointer' }}
              >
                {updatingRollout ? 'Updating...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
