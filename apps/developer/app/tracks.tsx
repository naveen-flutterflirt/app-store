'use client';
import React, { useState } from 'react';
import { API_URL, STORE_URL } from './config';

export interface AppVersionTrackItem {
  id: string;
  version: string;
  channel: 'internal' | 'beta' | 'stable';
  status: string;
  created_at: string;
  release_notes: string;
  rollout_pct: number;
  app_id: string;
  app_name: string;
  package_id: string;
  slug?: string;
  last_review?: {
    decision: string;
    notes: string;
    checklist?: {
      rejection_reason?: string;
      rejection_screenshots?: string[];
      detailed_description?: string;
      [key: string]: any;
    };
    created_at: string;
  } | null;
}

interface TestingTracksViewProps {
  apps: any[];
  submissions: any[];
  onRefresh: () => void;
  onOpenPublish: (app?: any, defaultTrack?: 'internal' | 'beta') => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function TestingTracksView({
  apps,
  submissions,
  onRefresh,
  onOpenPublish,
  showToast
}: TestingTracksViewProps) {
  const [selectedTrack, setSelectedTrack] = useState<'internal' | 'beta' | 'production'>('internal');
  const [selectedAppId, setSelectedAppId] = useState<string>('all');
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [viewingFeedback, setViewingFeedback] = useState<any | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Directly open feedback modal and fallback to direct endpoint if last_review is missing
  const handleOpenFeedback = async (sub: any) => {
    setViewingFeedback(sub);
    if (!sub.last_review) {
      setLoadingFeedback(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('bizbox_token') : null;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/dev/versions/${sub.id}/feedback`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data?.review) {
            setViewingFeedback((prev: any) => ({
              ...prev,
              last_review: data.review
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching review feedback:', err);
      } finally {
        setLoadingFeedback(false);
      }
    }
  };

  const internalVersions = submissions.filter(s => s.channel === 'internal');
  const betaVersions = submissions.filter(s => s.channel === 'beta');
  const productionVersions = submissions.filter(s => s.channel === 'stable' || !s.channel);

  const activeList = selectedTrack === 'internal' 
    ? internalVersions 
    : selectedTrack === 'beta' 
    ? betaVersions 
    : productionVersions;

  const filteredList = selectedAppId === 'all' 
    ? activeList 
    : activeList.filter(s => s.app_id === selectedAppId);

  const handlePromote = async (versionId: string, targetChannel: 'beta' | 'stable') => {
    setPromotingId(versionId);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bizbox_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/dev/versions/${versionId}/promote`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ targetChannel })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(
          targetChannel === 'stable' 
            ? 'Version successfully promoted to Production & submitted to Admin Review Queue!' 
            : 'Version promoted to Closed Beta Testing Track!',
          'success'
        );
        setSelectedTrack(targetChannel === 'stable' ? 'production' : 'beta');
        onRefresh();
      } else {
        showToast(data.message || 'Failed to promote track', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Promotion network error', 'error');
    } finally {
      setPromotingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Pink & White Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 50%, #fce7f3 100%)',
        border: '1px solid #fbcfe8',
        borderRadius: '20px',
        padding: '2.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: '0 4px 20px -2px rgba(236, 72, 153, 0.08)'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '999px',
            backgroundColor: '#ffffff',
            border: '1px solid #fbcfe8',
            color: '#db2777',
            fontSize: '0.75rem',
            fontWeight: 800,
            marginBottom: '0.85rem',
            boxShadow: '0 2px 6px rgba(236, 72, 153, 0.08)'
          }}>
            <span>🚀</span> Progressive Delivery & Staged Rollouts
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 900, margin: '0 0 0.5rem 0', color: '#0f172a', letterSpacing: '-0.02em' }}>
            Release Tracks & Progressive Rollouts
          </h2>
          <p style={{ margin: 0, fontSize: '0.92rem', color: '#475569', lineHeight: 1.6 }}>
            Safely test new versions internally within your restaurant sandbox, roll out to closed beta partner merchants, and promote directly to production with Cosign signing and zero downtime.
          </p>
        </div>

        <button
          onClick={() => onOpenPublish(undefined, selectedTrack === 'beta' ? 'beta' : 'internal')}
          style={{
            padding: '0.85rem 1.45rem',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.92rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(236, 72, 153, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
        >
          <span>+</span>
          <span>Upload Release Package</span>
        </button>
      </div>

      {/* Filter and Track Selector Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{
          display: 'inline-flex',
          padding: '4px',
          borderRadius: '14px',
          backgroundColor: '#ffffff',
          border: '1px solid #fbcfe8',
          boxShadow: '0 2px 8px rgba(236, 72, 153, 0.06)'
        }}>
          <button
            onClick={() => setSelectedTrack('internal')}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: selectedTrack === 'internal' ? '#ec4899' : 'transparent',
              color: selectedTrack === 'internal' ? '#ffffff' : '#64748b',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease',
              boxShadow: selectedTrack === 'internal' ? '0 2px 8px rgba(236, 72, 153, 0.3)' : 'none'
            }}
          >
            <span>🧪</span>
            <span>Internal Testing ({internalVersions.length})</span>
          </button>

          <button
            onClick={() => setSelectedTrack('beta')}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: selectedTrack === 'beta' ? '#ec4899' : 'transparent',
              color: selectedTrack === 'beta' ? '#ffffff' : '#64748b',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease',
              boxShadow: selectedTrack === 'beta' ? '0 2px 8px rgba(236, 72, 153, 0.3)' : 'none'
            }}
          >
            <span>👥</span>
            <span>Closed Beta ({betaVersions.length})</span>
          </button>

          <button
            onClick={() => setSelectedTrack('production')}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: selectedTrack === 'production' ? '#ec4899' : 'transparent',
              color: selectedTrack === 'production' ? '#ffffff' : '#64748b',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease',
              boxShadow: selectedTrack === 'production' ? '0 2px 8px rgba(236, 72, 153, 0.3)' : 'none'
            }}
          >
            <span>🌍</span>
            <span>Production Releases ({productionVersions.length})</span>
          </button>
        </div>

        {/* App Filter Selector */}
        {apps.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748b' }}>Filter App:</span>
            <select
              value={selectedAppId}
              onChange={e => setSelectedAppId(e.target.value)}
              style={{
                padding: '0.55rem 0.95rem',
                borderRadius: '10px',
                border: '1px solid #fbcfe8',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontSize: '0.84rem',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Applications ({apps.length})</option>
              {apps.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.package_id})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Track Table Container */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #fbcfe8',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px -2px rgba(236, 72, 153, 0.08)'
      }}>
        {filteredList.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
              {selectedTrack === 'internal' ? '🧪' : selectedTrack === 'beta' ? '👥' : '🌍'}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
              No releases currently in {selectedTrack === 'internal' ? 'Internal Testing' : selectedTrack === 'beta' ? 'Closed Beta' : 'Production'} track
            </div>
            <div style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
              {selectedTrack === 'internal'
                ? 'Upload an internal test bundle to run automated CI checks and verify on sandbox POS.'
                : selectedTrack === 'beta'
                ? 'Promote an internal release or upload directly to closed beta for trusted merchants.'
                : 'Promote an approved beta release to production to begin phased rollouts.'}
            </div>
            <button
              onClick={() => onOpenPublish(undefined, selectedTrack === 'beta' ? 'beta' : 'internal')}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                border: '1px solid #fbcfe8',
                backgroundColor: '#fdf2f8',
                color: '#db2777',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              + Create {selectedTrack === 'beta' ? 'Beta' : 'Internal'} Release
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#fdf2f8', borderBottom: '1px solid #fbcfe8' }}>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#db2777', textTransform: 'uppercase' }}>Version / App</th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#db2777', textTransform: 'uppercase' }}>Release Track</th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#db2777', textTransform: 'uppercase' }}>Review & CI Status</th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#db2777', textTransform: 'uppercase' }}>Rollout %</th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#db2777', textTransform: 'uppercase' }}>Submitted At</th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#db2777', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #fce7f3' }}>
                  <td style={{ padding: '1.1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: '#fdf2f8',
                        border: '1px solid #fbcfe8',
                        color: '#db2777',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.85rem'
                      }}>
                        {item.version}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                          {item.app_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          <code>{item.package_id}</code>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '1.1rem 1.25rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '3px 9px',
                      borderRadius: '6px',
                      backgroundColor: item.channel === 'internal' ? '#fdf2f8' : item.channel === 'beta' ? '#fef3c7' : '#dcfce7',
                      color: item.channel === 'internal' ? '#db2777' : item.channel === 'beta' ? '#b45309' : '#15803d',
                      border: `1px solid ${item.channel === 'internal' ? '#fbcfe8' : item.channel === 'beta' ? '#fde68a' : '#bbf7d0'}`,
                      textTransform: 'uppercase'
                    }}>
                      {item.channel}
                    </span>
                  </td>

                  <td style={{ padding: '1.1rem 1.25rem' }}>
                    {item.status === 'published' ? (
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#15803d', backgroundColor: '#dcfce7', padding: '3px 8px', borderRadius: '6px' }}>
                        ✓ LIVE IN STORE
                      </span>
                    ) : item.status === 'approved' ? (
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0284c7', backgroundColor: '#e0f2fe', padding: '3px 8px', borderRadius: '6px' }}>
                        ✓ APPROVED
                      </span>
                    ) : item.status === 'rejected' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#dc2626', backgroundColor: '#fee2e2', padding: '3px 8px', borderRadius: '6px' }}>
                          ✕ REJECTED
                        </span>
                        <button
                          onClick={() => handleOpenFeedback(item)}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#fff1f2',
                            border: '1px solid #fecdd3',
                            color: '#be123c',
                            cursor: 'pointer'
                          }}
                        >
                          View Reason & Proof →
                        </button>
                      </div>
                    ) : item.status === 'changes_requested' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#d97706', backgroundColor: '#fef3c7', padding: '3px 8px', borderRadius: '6px' }}>
                          ⚠️ CHANGES REQUESTED
                        </span>
                        <button
                          onClick={() => handleOpenFeedback(item)}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#fffbeb',
                            border: '1px solid #fde68a',
                            color: '#b45309',
                            cursor: 'pointer'
                          }}
                        >
                          Feedback →
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#d97706', backgroundColor: '#fef3c7', padding: '3px 8px', borderRadius: '6px' }}>
                        ⏳ IN REVIEW
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '1.1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '60px', height: '6px', borderRadius: '3px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                        <div style={{ width: `${item.rollout_pct || (item.channel === 'internal' ? 100 : item.status === 'published' ? 100 : 0)}%`, height: '100%', backgroundColor: '#ec4899' }} />
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
                        {item.rollout_pct || (item.channel === 'internal' ? 100 : item.status === 'published' ? 100 : 0)}%
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: '1.1rem 1.25rem', fontSize: '0.8rem', color: '#64748b' }}>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Just now'}
                  </td>

                  <td style={{ padding: '1.1rem 1.25rem', textAlign: 'right' }}>
                    {item.channel === 'internal' ? (
                      <button
                        disabled={promotingId === item.id}
                        onClick={() => handlePromote(item.id, 'beta')}
                        style={{
                          padding: '0.45rem 0.95rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                          color: '#ffffff',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: promotingId === item.id ? 'not-allowed' : 'pointer',
                          boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)'
                        }}
                      >
                        {promotingId === item.id ? 'Promoting...' : 'Promote to Beta →'}
                      </button>
                    ) : item.channel === 'beta' ? (
                      <button
                        disabled={promotingId === item.id}
                        onClick={() => handlePromote(item.id, 'stable')}
                        style={{
                          padding: '0.45rem 0.95rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                          color: '#ffffff',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: promotingId === item.id ? 'not-allowed' : 'pointer',
                          boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)'
                        }}
                      >
                        {promotingId === item.id ? 'Promoting...' : 'Promote to Production →'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 800 }}>
                        Production Ready
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Rejection / Review Feedback Modal */}
      {viewingFeedback && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #fbcfe8',
            borderRadius: '20px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 20px 40px -10px rgba(236, 72, 153, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🚨</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#be123c' }}>
                    Review Decision & Remediation
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {viewingFeedback.app_name} (v{viewingFeedback.version})
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingFeedback(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {loadingFeedback ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                Loading reviewer feedback and audit screenshots...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Reason */}
                <div style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px', padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#be123c', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Primary Policy / Violation Reason
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#9f1239' }}>
                    {viewingFeedback.last_review?.checklist?.rejection_reason || viewingFeedback.last_review?.notes?.split('\n\nDetailed Description:\n')[0] || viewingFeedback.last_review?.notes?.split('\n\n')[0] || 'Violation noted by platform reviewer.'}
                  </div>
                </div>

                {/* Detailed Description */}
                {(viewingFeedback.last_review?.checklist?.detailed_description || viewingFeedback.last_review?.notes) && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                      Detailed Remediation Instructions
                    </div>
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1rem',
                      fontSize: '0.88rem',
                      color: '#1e293b',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6
                    }}>
                      {viewingFeedback.last_review?.checklist?.detailed_description || (
                        viewingFeedback.last_review?.notes?.includes('\n\nDetailed Description:\n')
                          ? viewingFeedback.last_review.notes.split('\n\nDetailed Description:\n')[1]
                          : viewingFeedback.last_review?.notes
                      )}
                    </div>
                  </div>
                )}

                {/* Screenshots */}
                {viewingFeedback.last_review?.checklist?.rejection_screenshots && viewingFeedback.last_review?.checklist?.rejection_screenshots.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Reviewer Screenshot Proof ({viewingFeedback.last_review.checklist.rejection_screenshots.length})
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                      {viewingFeedback.last_review.checklist.rejection_screenshots.map((url: string, idx: number) => (
                        <a key={idx} href={url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                          <img
                            src={url}
                            alt={`Audit proof ${idx + 1}`}
                            style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button
                    onClick={() => setViewingFeedback(null)}
                    style={{
                      padding: '0.7rem 1.4rem',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    Understood & Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
