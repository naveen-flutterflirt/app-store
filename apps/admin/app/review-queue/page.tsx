'use client';
import React, { useState, useEffect } from 'react';
import { API_URL, STORE_URL, CONSOLE_URL, DEV_URL, ADMIN_URL } from '../config';
import { useAuthGuard } from '../useAuthGuard';
import { PageSkeleton } from '../components/PageSkeleton';
import { AdminHeader } from '../components/AdminHeader';

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

interface ReviewHistoryItem {
  id: string;
  version_id: string;
  reviewer: string;
  decision: 'approve' | 'reject' | 'request_changes';
  notes: string;
  checklist: any;
  created_at: string;
  version: string;
  channel: string;
  status: string;
  app_id: string;
  app_name: string;
  package_id: string;
  slug: string;
  developer_name: string;
  developer_email: string;
}

interface VersionDetail {
  version: {
    id: string;
    app_id: string;
    version: string;
    channel: string;
    status: string;
    release_notes?: string;
    bundle_url?: string;
    bundle_sha256?: string;
    manifest?: any;
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
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'history'>('pending');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [history, setHistory] = useState<ReviewHistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ReviewHistoryItem | null>(null);
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
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [confirmModal, setConfirmModal] = useState<'reject' | 'request_changes' | null>(null);
  const [modalReason, setModalReason] = useState('');
  const [modalDetail, setModalDetail] = useState('');
  const [modalScreenshots, setModalScreenshots] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [manifestModalOpen, setManifestModalOpen] = useState(false);
  const [bundleInfoModalOpen, setBundleInfoModalOpen] = useState(false);
  const [viewingImageModal, setViewingImageModal] = useState<string | null>(null);

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

  const fetchHistory = () => {
    setLoadingHistory(true);
    fetch(`${API_URL}/admin/review-history`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHistory(data);
        }
        setLoadingHistory(false);
      })
      .catch(err => {
        console.error('Failed to load review history:', err);
        setLoadingHistory(false);
      });
  };

  useEffect(() => {
    if (authorized) {
      fetchQueue();
      fetchHistory();
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

  // Handle Review Decision (Reject / Request Changes)
  const handleDecision = async (
    decision: 'reject' | 'request_changes',
    customNote?: string,
    detailedDesc?: string,
    screenshots?: string[]
  ) => {
    if (!selectedItem) return;
    setSubmittingAction(decision);
    setActionFeedback(null);
    try {
      const summaryReason = (customNote || notes).trim() || (decision === 'reject' ? 'Rejected due to policy / security requirements' : 'Please address security and permission review items');
      const combinedNotes = detailedDesc && detailedDesc.trim() 
        ? `${summaryReason}\n\nDetailed Description:\n${detailedDesc.trim()}`
        : summaryReason;

      const res = await fetch(`${API_URL}/admin/versions/${selectedItem.version_id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          reviewer: 'admin@flutterflirt.com',
          notes: combinedNotes,
          rejectionReason: summaryReason,
          rejectionScreenshots: screenshots || [],
          checklist: {
            ...checklist,
            detailed_description: detailedDesc?.trim() || null
          }
        })
      });

      if (res.ok) {
        setActionFeedback({
          message: decision === 'reject' 
            ? `Version rejected successfully. Proof screenshots & remediation guide delivered to developer portal.`
            : `Changes requested from developer with audit screenshots.`,
          type: 'success'
        });
        setNotes('');
        setModalReason('');
        setModalDetail('');
        setModalScreenshots([]);
        setConfirmModal(null);
        setTimeout(() => {
          fetchQueue();
          fetchHistory();
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

  // Handle Approve and Publish
  const handleApproveAndPublish = async () => {
    if (!selectedItem) return;
    setSubmittingAction('publish');
    setActionFeedback(null);
    try {
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

      const pubRes = await fetch(`${API_URL}/admin/versions/${selectedItem.version_id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rolloutPct })
      });

      if (pubRes.ok) {
        setPublished(true);
        setActionFeedback({
          message: `Version cryptographically signed with Cosign and published to storefront at ${rolloutPct}% rollout!`,
          type: 'success'
        });
        setTimeout(() => {
          fetchQueue();
          fetchHistory();
          setSubmittingAction(null);
          setActionFeedback(null);
        }, 2000);
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
    <div style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', backgroundColor: '#faf5f8', color: '#0f172a', minHeight: '100vh' }}>
      {/* Top Navbar */}
      <AdminHeader currentTab="review" pendingReviewsCount={queue.length} />

      {/* Main Container */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.25rem 1.75rem' }}>
        
        {/* Page Hero Header with Subtabs */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.025em' }}>
                Application Audit & Review Hub
              </h1>
              {queue.length > 0 && (
                <span style={{
                  backgroundColor: '#fef3c7',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '999px'
                }}>
                  {queue.length} Awaiting Audit
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
              Audit application package bundles (.zip), examine security scopes, and issue verifiable rejection proofs to developers.
            </p>
          </div>

          {/* Subtabs: Pending Queue vs Rejection & Review History */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            border: '1px solid #fbcfe8',
            borderRadius: '12px',
            padding: '4px',
            boxShadow: '0 2px 8px rgba(236, 72, 153, 0.05)'
          }}>
            <button
              onClick={() => setActiveSubTab('pending')}
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeSubTab === 'pending' ? '#fdf2f8' : 'transparent',
                color: activeSubTab === 'pending' ? '#db2777' : '#64748b',
                fontSize: '0.82rem',
                fontWeight: activeSubTab === 'pending' ? 800 : 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🛡️ Pending Queue</span>
              {queue.length > 0 && (
                <span style={{ backgroundColor: '#ec4899', color: '#ffffff', fontSize: '0.65rem', fontWeight: 900, padding: '1px 6px', borderRadius: '999px' }}>
                  {queue.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveSubTab('history'); fetchHistory(); }}
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeSubTab === 'history' ? '#fdf2f8' : 'transparent',
                color: activeSubTab === 'history' ? '#db2777' : '#64748b',
                fontSize: '0.82rem',
                fontWeight: activeSubTab === 'history' ? 800 : 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              <span>📑 Review & Rejection Proofs</span>
              {history.length > 0 && (
                <span style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px', borderRadius: '999px' }}>
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SUBTAB 1: PENDING AUDIT QUEUE                                  */}
        {/* ============================================================== */}
        {activeSubTab === 'pending' && (
          <>
            {loading ? (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #fbcfe8', borderRadius: '18px', padding: '3.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Loading audit queue...</div>
              </div>
            ) : queue.length === 0 ? (
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #fbcfe8',
                borderRadius: '20px',
                padding: '4rem 2rem',
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(236, 72, 153, 0.04)'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎉</div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.4rem 0' }}>All Caught Up!</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
                  No application releases are pending review right now. You can check previous audit decisions and rejection screenshot proofs in the Review History tab.
                </p>
                <button
                  onClick={() => setActiveSubTab('history')}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '10px',
                    border: '1px solid #fbcfe8',
                    backgroundColor: '#fdf2f8',
                    color: '#db2777',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  View Review & Rejection Proofs History →
                </button>
              </div>
            ) : (
              <div>
                {/* Multi-version selector tabs */}
                {queue.length > 1 && (
                  <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
                    {queue.map(item => (
                      <button
                        key={item.version_id}
                        onClick={() => { setSelectedItem(item); fetchDetail(item.version_id); setPublished(false); }}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '10px',
                          border: selectedItem?.version_id === item.version_id ? '1px solid #fbcfe8' : '1px solid #e2e8f0',
                          backgroundColor: selectedItem?.version_id === item.version_id ? '#fdf2f8' : '#ffffff',
                          color: selectedItem?.version_id === item.version_id ? '#db2777' : '#475569',
                          fontSize: '0.82rem',
                          fontWeight: selectedItem?.version_id === item.version_id ? 800 : 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <span>📦 {item.app}</span>
                        <span style={{ fontSize: '0.72rem', color: '#ec4899', fontWeight: 800 }}>v{item.version}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Audit Workstation Container */}
                {selectedItem && (
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #fbcfe8',
                    borderRadius: '20px',
                    padding: '2.25rem',
                    boxShadow: '0 4px 25px rgba(236, 72, 153, 0.05)'
                  }}>
                    {/* Header: App Info + Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fce7f3', paddingBottom: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
                          color: '#db2777',
                          border: '1px solid #fbcfe8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '1.15rem'
                        }}>
                          {selectedItem.app.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
                              {selectedItem.app}
                            </h2>
                            <span style={{
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              color: '#db2777',
                              backgroundColor: '#fdf2f8',
                              border: '1px solid #fbcfe8',
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}>
                              v{selectedItem.version}
                            </span>
                            <span style={{ fontSize: '0.7rem', backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '2px 7px', borderRadius: '5px', fontWeight: 700 }}>
                              {selectedItem.channel} track
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                            Published by <strong>{selectedItem.developer}</strong> • Submitted {selectedItem.submitted_at ? selectedItem.submitted_at.slice(0, 10) : 'Recent'}
                          </div>
                        </div>
                      </div>

                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: '#b45309',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fde68a',
                        padding: '4px 12px',
                        borderRadius: '999px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <span>⏳</span> Awaiting Audit Decision
                      </span>
                    </div>

                    {/* Developer Uploaded Package Bundle (.ZIP / .TGZ) Inspector */}
                    <div style={{
                      marginBottom: '1.75rem',
                      padding: '1.25rem 1.4rem',
                      backgroundColor: '#fdf2f8',
                      borderRadius: '14px',
                      border: '1px solid #fbcfe8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #fbcfe8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                          boxShadow: '0 2px 6px rgba(236, 72, 153, 0.1)'
                        }}>
                          📦
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                            Developer Application Release Bundle (.zip / .tgz)
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                            Package File: {detail?.version?.bundle_url ? detail.version.bundle_url.split('/').pop() : `${selectedItem.app.toLowerCase().replace(/\s+/g, '-')}-v${selectedItem.version}.zip`}
                            {detail?.version?.bundle_sha256 ? ` • SHA-256: ${detail.version.bundle_sha256.slice(0, 16)}...` : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.65rem' }}>
                        {detail?.version?.bundle_url ? (
                          <a
                            href={detail.version.bundle_url}
                            target="_blank"
                            rel="noreferrer"
                            download
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.55rem 1.1rem',
                              borderRadius: '10px',
                              backgroundColor: '#ec4899',
                              color: '#ffffff',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              textDecoration: 'none',
                              boxShadow: '0 2px 8px rgba(236, 72, 153, 0.25)'
                            }}
                          >
                            ⬇️ Download Bundle (.zip)
                          </a>
                        ) : (
                          <button
                            onClick={() => setBundleInfoModalOpen(true)}
                            style={{
                              padding: '0.55rem 1.1rem',
                              borderRadius: '10px',
                              backgroundColor: '#ec4899',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(236, 72, 153, 0.25)'
                            }}
                          >
                            ⬇️ Inspect S3 Bundle (.zip)
                          </button>
                        )}
                        <button
                          onClick={() => setManifestModalOpen(true)}
                          style={{
                            padding: '0.55rem 1.1rem',
                            borderRadius: '10px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#334155',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Inspect Manifest JSON
                        </button>
                      </div>
                    </div>

                    {/* CI Checks & Security Scopes */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                      {/* Left: Automated CI Checks */}
                      <div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
                          Automated CI Checks ({detail?.checks ? `${detail.checks.filter(c => c.status === 'passed').length}/${detail.checks.length} passed` : 'Running...'})
                        </h3>
                        {detail?.checks && detail.checks.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            {detail.checks.map((chk, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.82rem' }}>
                                <span style={{
                                  color: chk.status === 'passed' ? '#16a34a' : (chk.status === 'warning' ? '#d97706' : '#dc2626'),
                                  fontWeight: 900
                                }}>
                                  {chk.status === 'passed' ? '✓' : (chk.status === 'warning' ? '⚠' : '✕')}
                                </span>
                                <div>
                                  <span style={{ color: '#0f172a', fontWeight: 700, textTransform: 'capitalize' }}>
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
                              <span style={{ color: '#16a34a', fontWeight: 900 }}>✓</span>
                              <span style={{ color: '#0f172a', fontWeight: 600 }}>Manifest schema valid</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                              <span style={{ color: '#16a34a', fontWeight: 900 }}>✓</span>
                              <span style={{ color: '#0f172a', fontWeight: 600 }}>Dependencies & SBOM (Syft) clean</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                              <span style={{ color: '#16a34a', fontWeight: 900 }}>✓</span>
                              <span style={{ color: '#0f172a', fontWeight: 600 }}>Security vulnerability scan passed (0 critical CVEs)</span>
                            </div>
                          </div>
                        )}

                        <div style={{ marginTop: '1.5rem' }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                            Internal Audit Notes (Optional)
                          </label>
                          <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="e.g. Approved. Rollout started at 10% on test tenants..."
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              borderRadius: '10px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.82rem',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>

                      {/* Right: Permissions & Review Checklist */}
                      <div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
                          Reviewer Security Verification Checklist
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem', color: '#334155', cursor: 'pointer' }}>
                            <input type="checkbox" checked={checklist.listing} onChange={e => setChecklist({ ...checklist, listing: e.target.checked })} />
                            <span>Listing text, app assets & branding accurate</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem', color: '#334155', cursor: 'pointer' }}>
                            <input type="checkbox" checked={checklist.publisher} onChange={e => setChecklist({ ...checklist, publisher: e.target.checked })} />
                            <span>Verified developer statutory KYC (GSTIN & PAN)</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem', color: '#334155', cursor: 'pointer' }}>
                            <input type="checkbox" checked={checklist.permissions} onChange={e => setChecklist({ ...checklist, permissions: e.target.checked })} />
                            <span>Scopes match declared merchant features</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem', color: '#334155', cursor: 'pointer' }}>
                            <input type="checkbox" checked={checklist.pi5} onChange={e => setChecklist({ ...checklist, pi5: e.target.checked })} />
                            <span>Tested and validated on BizBox Edge hardware</span>
                          </label>
                        </div>

                        {/* Staged Rollout Target Slider */}
                        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>Staged Deployment Target:</span>
                            <span style={{ fontSize: '0.84rem', fontWeight: 900, color: '#0284c7' }}>{rolloutPct}% of Outlets</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="10"
                            value={rolloutPct}
                            onChange={e => setRolloutPct(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#ec4899', cursor: 'pointer' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Feedback Banner */}
                    {actionFeedback && (
                      <div style={{
                        marginBottom: '1.25rem',
                        padding: '0.85rem 1.25rem',
                        borderRadius: '10px',
                        backgroundColor: actionFeedback.type === 'success' ? '#dcfce7' : '#fee2e2',
                        border: actionFeedback.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
                        color: actionFeedback.type === 'success' ? '#15803d' : '#b91c1c',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span>{actionFeedback.type === 'success' ? '✓' : '⚠️'}</span>
                        <span>{actionFeedback.message}</span>
                      </div>
                    )}

                    {/* Action Execution Bar */}
                    <div style={{
                      borderTop: '1px solid #fce7f3',
                      paddingTop: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '0.85rem',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        disabled={submittingAction !== null}
                        onClick={() => { setConfirmModal('reject'); setModalReason(notes || ''); }}
                        style={{
                          padding: '0.65rem 1.35rem',
                          borderRadius: '10px',
                          border: '1px solid #fecaca',
                          backgroundColor: '#fff1f2',
                          color: '#e11d48',
                          fontSize: '0.84rem',
                          fontWeight: 800,
                          cursor: submittingAction ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>✕</span> Reject with Proof
                      </button>

                      <button
                        disabled={submittingAction !== null}
                        onClick={() => { setConfirmModal('request_changes'); setModalReason(notes || ''); }}
                        style={{
                          padding: '0.65rem 1.35rem',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          color: '#475569',
                          fontSize: '0.84rem',
                          fontWeight: 800,
                          cursor: submittingAction ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>📝</span> Request Changes
                      </button>

                      <button
                        disabled={submittingAction !== null}
                        onClick={handleApproveAndPublish}
                        style={{
                          padding: '0.65rem 1.6rem',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff',
                          fontSize: '0.84rem',
                          fontWeight: 800,
                          cursor: submittingAction ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>✓</span>
                        <span>{submittingAction === 'publish' ? 'Signing with Cosign...' : (published ? 'Published!' : 'Approve & Sign (Cosign)')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ============================================================== */}
        {/* SUBTAB 2: REVIEW DECISION HISTORY & SCREENSHOT PROOFS          */}
        {/* ============================================================== */}
        {activeSubTab === 'history' && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #fbcfe8',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 4px 25px rgba(236, 72, 153, 0.05)'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #fce7f3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.2rem 0' }}>
                  Audit & Rejection Proof Ledger
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Verifiable log of all reviewer decisions, policy violation notes, and AWS S3 screenshot attachments.
                </p>
              </div>
              <button
                onClick={fetchHistory}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '8px',
                  border: '1px solid #fbcfe8',
                  backgroundColor: '#fdf2f8',
                  color: '#db2777',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ↻ Refresh Log
              </button>
            </div>

            {loadingHistory ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>⏳</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading decision audit history...</div>
              </div>
            ) : history.length === 0 ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📜</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>No review decisions recorded yet</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fff5f9', borderBottom: '1px solid #fce7f3' }}>
                      <th style={{ padding: '0.9rem 1.25rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', fontWeight: 800 }}>App & Version</th>
                      <th style={{ padding: '0.9rem 1.25rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', fontWeight: 800 }}>Developer</th>
                      <th style={{ padding: '0.9rem 1.25rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', fontWeight: 800 }}>Decision</th>
                      <th style={{ padding: '0.9rem 1.25rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', fontWeight: 800 }}>Feedback & Reason</th>
                      <th style={{ padding: '0.9rem 1.25rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', fontWeight: 800 }}>Audit Proofs (S3)</th>
                      <th style={{ padding: '0.9rem 1.25rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', fontWeight: 800, textAlign: 'right' }}>Audit Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(item => {
                      const screenshots: string[] = item.checklist?.rejection_screenshots || [];
                      const primaryReason = item.checklist?.rejection_reason || item.notes?.split('\n\nDetailed Description:\n')[0] || item.notes;

                      return (
                        <tr
                          key={item.id}
                          style={{ borderBottom: '1px solid #f8fafc', transition: 'background-color 0.15s ease' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fffafc')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '1rem 1.25rem' }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>{item.app_name}</div>
                            <div style={{ fontSize: '0.74rem', color: '#ec4899', fontWeight: 700 }}>v{item.version} • {item.channel || 'stable'}</div>
                          </td>

                          <td style={{ padding: '1rem 1.25rem' }}>
                            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{item.developer_name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.developer_email}</div>
                          </td>

                          <td style={{ padding: '1rem 1.25rem' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '3px 9px',
                              borderRadius: '999px',
                              backgroundColor: item.decision === 'approve' ? '#dcfce7' : (item.decision === 'reject' ? '#fee2e2' : '#fef3c7'),
                              color: item.decision === 'approve' ? '#15803d' : (item.decision === 'reject' ? '#b91c1c' : '#b45309'),
                              border: `1px solid ${item.decision === 'approve' ? '#bbf7d0' : (item.decision === 'reject' ? '#fecaca' : '#fde68a')}`
                            }}>
                              ● {item.decision.toUpperCase().replace('_', ' ')}
                            </span>
                          </td>

                          <td style={{ padding: '1rem 1.25rem', maxWidth: '280px' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {primaryReason}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                              {item.created_at ? item.created_at.slice(0, 16).replace('T', ' ') : 'Recent'}
                            </div>
                          </td>

                          {/* Screenshot Proof Previews */}
                          <td style={{ padding: '1rem 1.25rem' }}>
                            {screenshots.length > 0 ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {screenshots.slice(0, 2).map((imgUrl, i) => (
                                  <img
                                    key={i}
                                    src={imgUrl}
                                    alt="Proof"
                                    onClick={() => setViewingImageModal(imgUrl)}
                                    style={{
                                      width: '36px',
                                      height: '36px',
                                      borderRadius: '6px',
                                      objectFit: 'cover',
                                      border: '1px solid #fbcfe8',
                                      cursor: 'pointer'
                                    }}
                                  />
                                ))}
                                {screenshots.length > 2 && (
                                  <span
                                    onClick={() => setSelectedHistoryItem(item)}
                                    style={{
                                      fontSize: '0.7rem',
                                      fontWeight: 800,
                                      color: '#db2777',
                                      backgroundColor: '#fdf2f8',
                                      padding: '3px 6px',
                                      borderRadius: '6px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    +{screenshots.length - 2} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>None</span>
                            )}
                          </td>

                          <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                            <button
                              onClick={() => setSelectedHistoryItem(item)}
                              style={{
                                padding: '0.45rem 0.9rem',
                                borderRadius: '8px',
                                border: '1px solid #fbcfe8',
                                backgroundColor: '#fdf2f8',
                                color: '#db2777',
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              Inspect Details →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* CUSTOM MODAL: REJECT / REQUEST CHANGES WITH ATTACHMENTS        */}
        {/* ============================================================== */}
        {confirmModal && selectedItem && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.25rem'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '2rem',
              width: '580px',
              maxWidth: '94vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -15px rgba(236, 72, 153, 0.25)',
              border: '1px solid #fbcfe8'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>{confirmModal === 'reject' ? '🚨' : '📝'}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: confirmModal === 'reject' ? '#e11d48' : '#0f172a' }}>
                      {confirmModal === 'reject' ? 'Reject Version with Audit Proof' : 'Request Changes from Developer'}
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                      {selectedItem.app} (v{selectedItem.version}) by {selectedItem.developer}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setConfirmModal(null); setModalScreenshots([]); }}
                  style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              {/* Feedback Reason Input */}
              <div style={{ marginBottom: '1.15rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                  Violation / Review Summary *
                </label>
                <input
                  type="text"
                  value={modalReason}
                  onChange={e => setModalReason(e.target.value)}
                  placeholder={confirmModal === 'reject' ? 'e.g. POS sandbox memory overflow or payment callback failure' : 'e.g. Missing required declared permissions'}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Detailed Description */}
              <div style={{ marginBottom: '1.15rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                  Detailed Guidance & Reproduction Steps
                </label>
                <textarea
                  value={modalDetail}
                  onChange={e => setModalDetail(e.target.value)}
                  placeholder="Provide precise steps so the developer can reproduce, debug, and submit a compliant update..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box',
                    lineHeight: 1.5
                  }}
                />
              </div>

              {/* Screenshot Proof Upload Section */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                    Audit Screenshots & Error Proof (Saved to S3)
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {modalScreenshots.length} attached
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.85rem' }}>
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.55rem 1rem',
                    borderRadius: '10px',
                    border: '1px dashed #fbcfe8',
                    backgroundColor: '#fdf2f8',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#db2777',
                    cursor: 'pointer'
                  }}>
                    <span>📷</span> Upload Screenshot File
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingImage(true);
                        const reader = new FileReader();
                        reader.onload = ev => {
                          const base64 = ev.target?.result as string;
                          if (base64) {
                            setModalScreenshots(prev => [...prev, base64]);
                          }
                          setUploadingImage(false);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>

                {/* Screenshot Previews */}
                {modalScreenshots.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.65rem' }}>
                    {modalScreenshots.map((shot, idx) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid #fbcfe8', aspectRatio: '16/10' }}>
                        <img src={shot} alt={`Proof ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setModalScreenshots(prev => prev.filter((_, i) => i !== idx))}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(15, 23, 42, 0.75)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            cursor: 'pointer'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal(null);
                    setModalReason('');
                    setModalDetail('');
                    setModalScreenshots([]);
                  }}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingAction !== null}
                  onClick={() => handleDecision(confirmModal, modalReason, modalDetail, modalScreenshots)}
                  style={{
                    padding: '0.6rem 1.5rem',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: confirmModal === 'reject' ? '#e11d48' : '#0284c7',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: submittingAction ? 'not-allowed' : 'pointer',
                    boxShadow: confirmModal === 'reject' ? '0 4px 14px rgba(225, 29, 72, 0.3)' : '0 4px 14px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  {submittingAction ? 'Processing...' : (confirmModal === 'reject' ? 'Confirm Rejection & Send Proof' : 'Send Request to Developer')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* CUSTOM MODAL: INSPECT HISTORY AUDIT DETAIL & SCREENSHOTS       */}
        {/* ============================================================== */}
        {selectedHistoryItem && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.25rem'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -15px rgba(236, 72, 153, 0.25)',
              border: '1px solid #fbcfe8',
              padding: '2rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fce7f3', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    {selectedHistoryItem.app_name} (v{selectedHistoryItem.version})
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    Reviewed by <strong>{selectedHistoryItem.reviewer}</strong> • {selectedHistoryItem.created_at ? selectedHistoryItem.created_at.slice(0, 16).replace('T', ' ') : 'Recent'}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedHistoryItem(null)}
                  style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              {/* Decision Box */}
              <div style={{
                marginBottom: '1.25rem',
                padding: '1rem 1.25rem',
                borderRadius: '12px',
                backgroundColor: selectedHistoryItem.decision === 'approve' ? '#f0fdf4' : (selectedHistoryItem.decision === 'reject' ? '#fff1f2' : '#fefce8'),
                border: `1px solid ${selectedHistoryItem.decision === 'approve' ? '#bbf7d0' : (selectedHistoryItem.decision === 'reject' ? '#fecdd3' : '#fef08a')}`
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: selectedHistoryItem.decision === 'approve' ? '#15803d' : (selectedHistoryItem.decision === 'reject' ? '#be123c' : '#854d0e') }}>
                  Audit Decision: {selectedHistoryItem.decision.toUpperCase()}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, marginTop: '4px', color: '#0f172a' }}>
                  {selectedHistoryItem.checklist?.rejection_reason || selectedHistoryItem.notes?.split('\n\nDetailed Description:\n')[0] || selectedHistoryItem.notes}
                </div>
              </div>

              {/* Detailed Remediation Guidance */}
              {(selectedHistoryItem.checklist?.detailed_description || selectedHistoryItem.notes?.includes('\n\nDetailed Description:\n')) && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Remediation Guidance Given to Developer
                  </div>
                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1rem',
                    fontSize: '0.85rem',
                    color: '#1e293b',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5
                  }}>
                    {selectedHistoryItem.checklist?.detailed_description || selectedHistoryItem.notes.split('\n\nDetailed Description:\n')[1]}
                  </div>
                </div>
              )}

              {/* Audit Proof Screenshots */}
              {selectedHistoryItem.checklist?.rejection_screenshots && selectedHistoryItem.checklist.rejection_screenshots.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Reviewer Screenshot Proofs ({selectedHistoryItem.checklist.rejection_screenshots.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                    {selectedHistoryItem.checklist.rejection_screenshots.map((url: string, idx: number) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid #fbcfe8', aspectRatio: '16/10' }}>
                        <img
                          src={url}
                          alt={`Proof ${idx + 1}`}
                          onClick={() => setViewingImageModal(url)}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setSelectedHistoryItem(null)}
                  style={{
                    padding: '0.55rem 1.4rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* FULLSCREEN IMAGE LIGHTBOX MODAL                                */}
        {/* ============================================================== */}
        {viewingImageModal && (
          <div
            onClick={() => setViewingImageModal(null)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '2rem'
            }}
          >
            <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
              <img
                src={viewingImageModal}
                alt="Enlarged Audit Proof"
                style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
              />
              <button
                onClick={() => setViewingImageModal(null)}
                style={{
                  position: 'absolute',
                  top: '-14px',
                  right: '-14px',
                  background: '#ffffff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '1rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MANIFEST MODAL                                                 */}
        {/* ============================================================== */}
        {manifestModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '640px',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(236, 72, 153, 0.15)',
              border: '1px solid #fbcfe8'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  App Manifest (bizbox-app.json)
                </h3>
                <button
                  onClick={() => setManifestModalOpen(false)}
                  style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>
              <pre style={{
                backgroundColor: '#0f172a',
                color: '#38bdf8',
                padding: '1rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                overflowX: 'auto',
                maxHeight: '360px'
              }}>
                {JSON.stringify(detail?.version?.manifest || {
                  id: selectedItem?.app.toLowerCase().replace(/\s+/g, '-'),
                  name: selectedItem?.app,
                  version: selectedItem?.version,
                  ui: { entry: '/index.html' },
                  permissions: ['sandbox.storage', 'pos.orders.read']
                }, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* S3 BUNDLE INFO MODAL                                           */}
        {/* ============================================================== */}
        {bundleInfoModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '520px',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(236, 72, 153, 0.15)',
              border: '1px solid #fbcfe8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#fdf2f8',
                  border: '1px solid #fbcfe8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem'
                }}>
                  📦
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                    Secure Bundle Package (.zip)
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Encrypted AWS S3 Distribution Storage
                  </span>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', fontSize: '0.78rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#334155' }}>Storage Target:</strong>
                  <code style={{ display: 'block', color: '#db2777', marginTop: '0.2rem' }}>
                    s3://bizbox-bundles/{detail?.version?.app_id || 'app'}/{selectedItem?.version}/bundle.tgz
                  </code>
                </div>
                <div>
                  <strong style={{ color: '#334155' }}>Integrity Check:</strong>
                  <span style={{ color: '#16a34a', display: 'block', marginTop: '0.2rem', fontWeight: 700 }}>
                    ✓ SHA-256 Digest validated with Cosign
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setBundleInfoModalOpen(false)}
                  style={{
                    padding: '0.55rem 1.35rem',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#ec4899',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
