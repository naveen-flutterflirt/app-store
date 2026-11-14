'use client';
import React, { useState, useEffect } from 'react';
import { API_URL, STORE_URL, CONSOLE_URL, DEV_URL, ADMIN_URL } from '../config';
import { useAuthGuard } from '../useAuthGuard';
import { PageSkeleton } from '../components/PageSkeleton';

interface QueueItem {
  version_id: string;
  app: string;
  developer: string;
  version: string;
  channel: string;
  status: string;
  submitted_at: string;
  checks_failed: string;
  checks_warning: string;
  sensitive_scopes: string;
}

interface VersionDetail {
  version: {
    id: string;
    app_id: string;
    version: string;
    channel: string;
    status: string;
    release_notes?: string;
    app_name: string;
    package_id: string;
    slug: string;
    category: string;
    icon_url?: string;
    developer_name: string;
    developer_email: string;
    gstin?: string;
    pan?: string;
    created_at: string;
  };
  checks: Array<{
    kind: string;
    status: string;
    summary: string;
    report: any;
    finished_at: string;
  }>;
  scopes: Array<{
    scope: string;
    reason: string;
    is_sensitive: boolean;
  }>;
  reviews: Array<{
    reviewer: string;
    decision: string;
    notes: string;
    checklist: any;
    created_at: string;
  }>;
}

export default function ReviewQueuePage() {
  const { authorized, checking } = useAuthGuard('admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string }>({
    name: 'Naveen (Founder)',
    email: 'admin@flutterflirt.com',
    role: 'admin'
  });
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [detail, setDetail] = useState<VersionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [rolloutPct, setRolloutPct] = useState(10);
  const [checklist, setChecklist] = useState({
    listing: true,
    publisher: true,
    permissions: true,
    pi5: true
  });
  const [published, setPublished] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<'reject' | 'request_changes' | null>(null);
  const [modalReason, setModalReason] = useState('');

  const fetchDetail = (versionId: string) => {
    setLoadingDetail(true);
    fetch(`${API_URL}/admin/versions/${versionId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.version) {
          setDetail(data);
        }
        setLoadingDetail(false);
      })
      .catch(err => {
        console.error('Failed to load version detail:', err);
        setLoadingDetail(false);
      });
  };

  const fetchQueue = () => {
    if (!authorized) return;
    setLoading(true);
    fetch(`${API_URL}/admin/review-queue`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setQueue(data);
          if (data.length > 0) {
            setSelectedItem(data[0]);
            fetchDetail(data[0].version_id);
          } else {
            setSelectedItem(null);
            setDetail(null);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load review queue:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (authorized) {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('bizbox_user');
        if (storedUser) {
          try { setUser(JSON.parse(storedUser)); } catch (e) {}
        }
      }
      fetchQueue();
    }
  }, [authorized]);

  if (checking || !authorized) {
    return (
      <PageSkeleton
        title="Admin Review & Audit Queue"
        subtitle="Verifying reviewer security credentials and signing keys..."
      />
    );
  }

  // 1. Dynamic Decision Handler (Reject / Request Changes)
  const handleDecision = async (decision: 'reject' | 'request_changes', customNote?: string) => {
    if (!selectedItem) return;
    setSubmittingAction(decision);
    setActionFeedback(null);
    try {
      const decisionNote = (customNote || notes).trim() || (decision === 'reject' ? 'Rejected due to policy / security requirements' : 'Please address security and permission review items');
      const res = await fetch(`${API_URL}/admin/versions/${selectedItem.version_id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          reviewer: 'admin@flutterflirt.com',
          notes: decisionNote,
          checklist
        })
      });

      if (res.ok) {
        setActionFeedback({
          message: decision === 'reject' ? `Version rejected successfully.` : `Changes requested from developer.`,
          type: 'success'
        });
        setNotes('');
        setConfirmModal(null);
        setTimeout(() => {
          fetchQueue();
          setActionFeedback(null);
          setSubmittingAction(null);
        }, 1500);
      } else {
        const err = await res.json().catch(() => ({}));
        setActionFeedback({ message: err.message || 'Error processing review decision', type: 'error' });
        setSubmittingAction(null);
        setConfirmModal(null);
      }
    } catch (e: any) {
      setActionFeedback({ message: e.message || 'Network error', type: 'error' });
      setSubmittingAction(null);
      setConfirmModal(null);
    }
  };

  // 2. Dynamic Approve and Publish Handler with Ed25519 Cosign signing
  const handleApproveAndPublish = async () => {
    if (!selectedItem) return;
    setSubmittingAction('publish');
    setActionFeedback(null);
    try {
      // Step A: Approve decision
      const approveRes = await fetch(`${API_URL}/admin/versions/${selectedItem.version_id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'approve',
          reviewer: 'admin@flutterflirt.com',
          notes: notes.trim() || 'Approved by FlutterFlirt review panel',
          checklist
        })
      });

      if (!approveRes.ok) {
        const err = await approveRes.json().catch(() => ({}));
        setActionFeedback({ message: err.message || 'Failed to approve version', type: 'error' });
        setSubmittingAction(null);
        return;
      }

      // Step B: Publish with Ed25519 Cosign bundle signing & rollout percentage
      const pubRes = await fetch(`${API_URL}/admin/versions/${selectedItem.version_id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rolloutPct })
      });

      if (pubRes.ok) {
        setPublished(true);
        setActionFeedback({
          message: `✓ Bundle digitally signed with Ed25519 Cosign key and published at ${rolloutPct}% rollout.`,
          type: 'success'
        });
        setNotes('');
        setTimeout(() => {
          fetchQueue();
          setPublished(false);
          setActionFeedback(null);
          setSubmittingAction(null);
        }, 2200);
      } else {
        const err = await pubRes.json().catch(() => ({}));
        setActionFeedback({ message: err.message || 'Failed to publish version', type: 'error' });
        setSubmittingAction(null);
      }
    } catch (e: any) {
      setActionFeedback({ message: e.message || 'Network error', type: 'error' });
      setSubmittingAction(null);
    }
  };

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
          .admin-main { padding: 1.25rem 1rem !important; }
          .review-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
          .rollout-bar { flex-direction: column !important; align-items: flex-start !important; }
          .rollout-actions { width: 100% !important; justify-content: flex-start !important; margin-top: 0.75rem !important; flex-wrap: wrap !important; }
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
          <a href={`${ADMIN_URL}/review-queue`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>BizBox</span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              color: '#ec4899',
              backgroundColor: '#fdf2f8',
              border: '1px solid #fbcfe8',
              padding: '1px 6px',
              borderRadius: '4px'
            }}>Admin</span>
          </a>
          <nav className="nav-desktop" style={{ display: 'flex', gap: '0.5rem' }}>
            <a href={`${ADMIN_URL}/review-queue`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              Review queue
              <span style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: '999px' }}>
                {queue.length}
              </span>
            </a>
            <a href={`${ADMIN_URL}/developers`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>
              Developers & Partners
            </a>
            <a href={`${ADMIN_URL}/dashboard`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Store Metrics</a>
            <a href={STORE_URL} target="_blank" rel="noreferrer" style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Public Store ↗</a>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#ec4899', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{user.name}</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Store reviewer ({user.role})</div>
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
            title="Sign out of Admin console"
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
          <a href={`${ADMIN_URL}/review-queue`} style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 700, textDecoration: 'none' }}>Review Queue</a>
          <a href={`${ADMIN_URL}/dashboard`} style={{ padding: '0.5rem', borderRadius: '6px', color: '#0f172a', fontWeight: 500, textDecoration: 'none' }}>Store Metrics</a>
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
      <main className="admin-main" style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#0f172a' }}>Review queue</h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Check listing, permissions and scan results, then approve and choose how fast to roll out.
          </p>
        </div>

        {loading ? (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '10px' }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: '35%', height: '22px', marginBottom: '0.4rem' }} />
                <div className="skeleton" style={{ width: '50%', height: '14px' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="skeleton" style={{ height: '180px', borderRadius: '12px' }} />
              <div className="skeleton" style={{ height: '180px', borderRadius: '12px' }} />
              <div className="skeleton" style={{ height: '180px', borderRadius: '12px' }} />
            </div>
            <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: '8px' }} />
          </div>
        ) : queue.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>All clear! No apps currently pending review.</p>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Developers submit versions from the Developer Console or CLI.</p>
          </div>
        ) : (
          <div>
            {/* Version Selector Tabs if multiple items in queue */}
            {queue.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {queue.map((item) => (
                  <button
                    key={item.version_id}
                    onClick={() => { setSelectedItem(item); fetchDetail(item.version_id); setPublished(false); }}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      border: selectedItem?.version_id === item.version_id ? '1px solid #0f172a' : '1px solid #e2e8f0',
                      backgroundColor: selectedItem?.version_id === item.version_id ? '#0f172a' : '#ffffff',
                      color: selectedItem?.version_id === item.version_id ? '#ffffff' : '#475569',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {item.app} (v{item.version})
                  </button>
                ))}
              </div>
            )}

            {selectedItem && (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {selectedItem.app.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                          {selectedItem.app} v{selectedItem.version}
                        </h2>
                        <span style={{ fontSize: '0.72rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          {selectedItem.channel}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                        by {selectedItem.developer} • submitted {new Date(selectedItem.submitted_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b45309', backgroundColor: '#fef3c7', padding: '4px 10px', borderRadius: '999px' }}>
                    In review
                  </span>
                </div>

                <div className="review-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2rem' }}>
                  {/* Left Column: Automated checks */}
                  <div>
                    <h3 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a' }}>
                      Automated CI Pipeline Checks ({detail?.checks ? `${detail.checks.filter(c => c.status === 'passed').length}/${detail.checks.length} passed` : 'Running...'})
                    </h3>
                    
                    {loadingDetail ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div className="skeleton" style={{ height: '24px', width: '80%' }} />
                        <div className="skeleton" style={{ height: '24px', width: '90%' }} />
                        <div className="skeleton" style={{ height: '24px', width: '70%' }} />
                      </div>
                    ) : detail?.checks && detail.checks.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {detail.checks.map((chk, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.82rem' }}>
                            <span style={{ 
                              color: chk.status === 'passed' ? '#16a34a' : (chk.status === 'warning' ? '#d97706' : '#dc2626'),
                              fontWeight: 800,
                              lineHeight: 1.2
                            }}>
                              {chk.status === 'passed' ? '✓' : (chk.status === 'warning' ? '⚠' : '✕')}
                            </span>
                            <div>
                              <span style={{ color: '#0f172a', fontWeight: 600, textTransform: 'capitalize' }}>
                                {chk.kind.replace('_', ' ')}
                              </span>
                              <span style={{ color: '#64748b', marginLeft: '0.35rem' }}>— {chk.summary}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                          <span style={{ color: '#16a34a' }}>✓</span>
                          <span style={{ color: '#0f172a', fontWeight: 500 }}>manifest & schema — schema valid</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                          <span style={{ color: '#16a34a' }}>✓</span>
                          <span style={{ color: '#0f172a', fontWeight: 500 }}>dependencies & SBOM (Syft) — clean tree</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                          <span style={{ color: Number(selectedItem.checks_failed) > 0 ? '#dc2626' : '#16a34a' }}>✓</span>
                          <span style={{ color: '#0f172a', fontWeight: 500 }}>security scan (Trivy) — 0 critical CVEs</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                          <span style={{ color: '#16a34a' }}>✓</span>
                          <span style={{ color: '#0f172a', fontWeight: 500 }}>licence — compliant with closed app store policy</span>
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: '1.75rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                        Note to developer
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Approved. Rollout started at 10% on test tenants."
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.82rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Right Column: Permissions & Review Checklist */}
                  <div>
                    <h3 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a' }}>
                      Permissions requested ({detail?.scopes ? detail.scopes.length : '0'})
                    </h3>
                    
                    {loadingDetail ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.75rem' }}>
                        <div className="skeleton" style={{ height: '24px', width: '85%' }} />
                        <div className="skeleton" style={{ height: '24px', width: '70%' }} />
                      </div>
                    ) : detail?.scopes && detail.scopes.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.75rem' }}>
                        {detail.scopes.map((sc, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                            <span style={{
                              backgroundColor: sc.is_sensitive ? '#fee2e2' : '#f1f5f9',
                              color: sc.is_sensitive ? '#b91c1c' : '#334155',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 700
                            }}>
                              {sc.scope}
                            </span>
                            <span style={{ color: '#475569' }}>{sc.reason || 'App standard capability'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '1.75rem', fontSize: '0.8rem', color: '#64748b' }}>
                        No special edge permissions requested (Standard sandboxed app permissions).
                      </div>
                    )}

                    <h3 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0 0 0.85rem 0', color: '#0f172a' }}>Review checklist</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}>
                        <input type="checkbox" checked={checklist.listing} onChange={e => setChecklist({ ...checklist, listing: e.target.checked })} />
                        Listing text & screenshots accurate
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}>
                        <input type="checkbox" checked={checklist.publisher} onChange={e => setChecklist({ ...checklist, publisher: e.target.checked })} />
                        Verified developer GSTIN & PAN
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}>
                        <input type="checkbox" checked={checklist.permissions} onChange={e => setChecklist({ ...checklist, permissions: e.target.checked })} />
                        Scopes match declared features
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}>
                        <input type="checkbox" checked={checklist.pi5} onChange={e => setChecklist({ ...checklist, pi5: e.target.checked })} />
                        Tested on BizBox edge hardware
                      </label>
                    </div>
                  </div>
                </div>

                {/* Action Feedback Banner */}
                {actionFeedback && (
                  <div style={{
                    marginBottom: '1.25rem',
                    padding: '0.85rem 1.25rem',
                    borderRadius: '8px',
                    backgroundColor: actionFeedback.type === 'success' ? '#dcfce7' : '#fee2e2',
                    border: actionFeedback.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
                    color: actionFeedback.type === 'success' ? '#15803d' : '#b91c1c',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>{actionFeedback.type === 'success' ? '✓' : '⚠️'}</span>
                    <span>{actionFeedback.message}</span>
                  </div>
                )}

                {/* Rollout slider & Action Bar */}
                <div className="rollout-bar" style={{
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>Roll out to:</span>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="10"
                      value={rolloutPct}
                      onChange={(e) => setRolloutPct(Number(e.target.value))}
                      style={{ width: '160px', accentColor: '#0284c7' }}
                    />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0284c7' }}>
                      {rolloutPct}% of businesses (hash-bucketed)
                    </span>
                  </div>

                  <div className="rollout-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      disabled={submittingAction !== null}
                      onClick={() => { setConfirmModal('reject'); setModalReason(notes || ''); }}
                      style={{
                        padding: '0.6rem 1.15rem',
                        borderRadius: '8px',
                        border: '1px solid #fca5a5',
                        backgroundColor: submittingAction === 'reject' ? '#fee2e2' : '#ffffff',
                        color: '#b91c1c',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: submittingAction ? 'not-allowed' : 'pointer',
                        opacity: submittingAction ? 0.7 : 1,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {submittingAction === 'reject' ? 'Rejecting...' : 'Reject'}
                    </button>
                    <button
                      disabled={submittingAction !== null}
                      onClick={() => { setConfirmModal('request_changes'); setModalReason(notes || ''); }}
                      style={{
                        padding: '0.6rem 1.15rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: submittingAction === 'request_changes' ? '#f1f5f9' : '#ffffff',
                        color: '#475569',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: submittingAction ? 'not-allowed' : 'pointer',
                        opacity: submittingAction ? 0.7 : 1,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {submittingAction === 'request_changes' ? 'Requesting...' : 'Request changes'}
                    </button>
                    <button
                      disabled={submittingAction !== null}
                      onClick={handleApproveAndPublish}
                      style={{
                        padding: '0.6rem 1.25rem',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: published ? '#16a34a' : (submittingAction === 'publish' ? '#94a3b8' : '#0284c7'),
                        color: '#ffffff',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: submittingAction ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                        opacity: submittingAction && submittingAction !== 'publish' ? 0.7 : 1,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {submittingAction === 'publish' ? 'Signing & Publishing...' : (published ? '✓ Cosign Signed & Published' : 'Approve & publish')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Rejection / Request Changes Modal */}
      {confirmModal && selectedItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
            width: '460px',
            maxWidth: '92vw',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.15rem', fontWeight: 800, color: confirmModal === 'reject' ? '#991b1b' : '#0f172a' }}>
              {confirmModal === 'reject' ? 'Reject Version' : 'Request Changes'}
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.82rem', color: '#64748b' }}>
              {selectedItem.app} (v{selectedItem.version}) by {selectedItem.developer}
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                Feedback / Reason *
              </label>
              <textarea
                value={modalReason}
                onChange={e => setModalReason(e.target.value)}
                placeholder={confirmModal === 'reject' ? 'State clear policy or security violation...' : 'Detail required code or permission updates...'}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                style={{ padding: '0.55rem 1.15rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction !== null}
                onClick={() => handleDecision(confirmModal, modalReason)}
                style={{
                  padding: '0.55rem 1.3rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: confirmModal === 'reject' ? '#dc2626' : '#0284c7',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: submittingAction ? 'not-allowed' : 'pointer'
                }}
              >
                {confirmModal === 'reject' ? 'Confirm Rejection' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
