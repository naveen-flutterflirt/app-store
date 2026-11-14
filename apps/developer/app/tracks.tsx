'use client';
import React, { useState } from 'react';
import { API_URL, ADMIN_URL, STORE_URL } from './config';

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
  const [selectedAppId, setSelectedAppId] = useState<string>(apps[0]?.id || 'all');
  const [promotingId, setPromotingId] = useState<string | null>(null);

  // Filter submissions by track
  const internalVersions = submissions.filter(s => s.channel === 'internal');
  const betaVersions = submissions.filter(s => s.channel === 'beta');
  const productionVersions = submissions.filter(s => s.channel === 'stable' || (!s.channel && s.status === 'published') || s.status === 'in_review');

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
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
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
        onRefresh();
      } else {
        showToast(data.message || 'Failed to promote track', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Promotion network error', 'error');
    } finally {
      setPromotingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner explaining Play Store Release Lifecycle */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)',
        border: '1px solid #fbcfe8',
        borderRadius: '20px',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
        boxShadow: '0 10px 25px -5px rgba(236, 72, 153, 0.08)'
      }}>
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🚀</span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Release Tracks & Testing Lifecycle
            </h2>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              padding: '3px 10px',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>Google Play Standard</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 }}>
            Safely iterate and verify your restaurant apps. Start with <strong>Internal Testing</strong> for your team sandbox (no review required), invite partner outlets on <strong>Closed Beta</strong>, and promote to <strong>Production Review</strong> for storewide release.
          </p>
        </div>

        <button
          onClick={() => onOpenPublish(undefined, selectedTrack === 'beta' ? 'beta' : 'internal')}
          style={{
            padding: '0.75rem 1.4rem',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: '#ec4899',
            color: '#ffffff',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(236, 72, 153, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'transform 0.15s ease'
          }}
        >
          <span>+ Create Release in {selectedTrack === 'internal' ? 'Internal' : selectedTrack === 'beta' ? 'Beta' : 'Production'}</span>
        </button>
      </div>

      {/* Track Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.6rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setSelectedTrack('internal')}
          style={{
            padding: '0.65rem 1.35rem',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: selectedTrack === 'internal' ? '#0f172a' : '#f8fafc',
            color: selectedTrack === 'internal' ? '#ffffff' : '#64748b',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: selectedTrack === 'internal' ? '0 4px 12px rgba(15, 23, 42, 0.2)' : 'none',
            transition: 'all 0.15s'
          }}
        >
          <span>🧪 Internal Testing</span>
          <span style={{
            fontSize: '0.7rem',
            padding: '2px 7px',
            borderRadius: '999px',
            backgroundColor: selectedTrack === 'internal' ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0',
            color: selectedTrack === 'internal' ? '#ffffff' : '#475569',
            fontWeight: 700
          }}>
            {internalVersions.length}
          </span>
        </button>

        <button
          onClick={() => setSelectedTrack('beta')}
          style={{
            padding: '0.65rem 1.35rem',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: selectedTrack === 'beta' ? '#0f172a' : '#f8fafc',
            color: selectedTrack === 'beta' ? '#ffffff' : '#64748b',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: selectedTrack === 'beta' ? '0 4px 12px rgba(15, 23, 42, 0.2)' : 'none',
            transition: 'all 0.15s'
          }}
        >
          <span>👥 Closed Beta Track</span>
          <span style={{
            fontSize: '0.7rem',
            padding: '2px 7px',
            borderRadius: '999px',
            backgroundColor: selectedTrack === 'beta' ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0',
            color: selectedTrack === 'beta' ? '#ffffff' : '#475569',
            fontWeight: 700
          }}>
            {betaVersions.length}
          </span>
        </button>

        <button
          onClick={() => setSelectedTrack('production')}
          style={{
            padding: '0.65rem 1.35rem',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: selectedTrack === 'production' ? '#0f172a' : '#f8fafc',
            color: selectedTrack === 'production' ? '#ffffff' : '#64748b',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: selectedTrack === 'production' ? '0 4px 12px rgba(15, 23, 42, 0.2)' : 'none',
            transition: 'all 0.15s'
          }}
        >
          <span>🌐 Production Releases</span>
          <span style={{
            fontSize: '0.7rem',
            padding: '2px 7px',
            borderRadius: '999px',
            backgroundColor: selectedTrack === 'production' ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0',
            color: selectedTrack === 'production' ? '#ffffff' : '#475569',
            fontWeight: 700
          }}>
            {productionVersions.length}
          </span>
        </button>
      </div>

      {/* Track Explanation Card */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderRadius: '16px',
        backgroundColor: selectedTrack === 'internal' ? '#f0fdf4' : selectedTrack === 'beta' ? '#f0f9ff' : '#fdf2f8',
        border: `1px solid ${selectedTrack === 'internal' ? '#bbf7d0' : selectedTrack === 'beta' ? '#bae6fd' : '#fbcfe8'}`,
        fontSize: '0.85rem',
        color: selectedTrack === 'internal' ? '#166534' : selectedTrack === 'beta' ? '#0369a1' : '#9d174d',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem'
      }}>
        <div style={{ fontSize: '1.5rem' }}>
          {selectedTrack === 'internal' ? '🧪' : selectedTrack === 'beta' ? '👥' : '🌐'}
        </div>
        <div>
          {selectedTrack === 'internal' && (
            <div>
              <strong>Internal Track Active:</strong> Upload builds for immediate internal sandbox verification. Does not require admin review. Ready instantly for your team testers.
            </div>
          )}
          {selectedTrack === 'beta' && (
            <div>
              <strong>Closed Beta Track:</strong> Invite selected pilot restaurant merchants via test link. Gather real telemetry and user feedback before applying for public store publication.
            </div>
          )}
          {selectedTrack === 'production' && (
            <div>
              <strong>Production Release Track:</strong> Releases are signed cryptographically with Ed25519 Cosign and submitted to the Admin Security Queue before publishing with staged rollout (10% → 100%).
            </div>
          )}
        </div>
      </div>

      {/* Version Table */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', overflowX: 'auto', boxShadow: '0 4px 20px -6px rgba(0, 0, 0, 0.04)' }}>
        <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '1rem 1.4rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Version & App</th>
              <th style={{ padding: '1rem 1.4rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Track Status</th>
              <th style={{ padding: '1rem 1.4rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Release Notes</th>
              <th style={{ padding: '1rem 1.4rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Testers / Rollout</th>
              <th style={{ padding: '1rem 1.4rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                  No releases currently in <strong>{selectedTrack.toUpperCase()}</strong> track.
                  <div style={{ marginTop: '0.75rem' }}>
                    <button
                      onClick={() => onOpenPublish(undefined, selectedTrack === 'beta' ? 'beta' : 'internal')}
                      style={{
                        padding: '0.55rem 1.15rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      + Create Release
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredList.map((ver) => (
                <tr key={ver.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1.15rem 1.4rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                      {ver.app_name} <span style={{ color: '#ec4899', marginLeft: '0.25rem' }}>v{ver.version}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>{ver.package_id}</div>
                  </td>
                  <td style={{ padding: '1.15rem 1.4rem' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      backgroundColor:
                        ver.status === 'published' ? '#dcfce7' :
                        ver.status === 'in_review' ? '#fef3c7' :
                        ver.status === 'draft' ? '#f1f5f9' : '#e0f2fe',
                      color:
                        ver.status === 'published' ? '#15803d' :
                        ver.status === 'in_review' ? '#b45309' :
                        ver.status === 'draft' ? '#475569' : '#0369a1'
                    }}>
                      ● {ver.status === 'in_review' ? 'In Admin Review' : ver.status}
                    </span>
                  </td>
                  <td style={{ padding: '1.15rem 1.4rem', fontSize: '0.82rem', color: '#475569', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ver.release_notes || 'Internal test build'}
                  </td>
                  <td style={{ padding: '1.15rem 1.4rem', fontSize: '0.82rem', color: '#0f172a', fontWeight: 600 }}>
                    {selectedTrack === 'internal' ? (
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Sandbox Active (Unlimited)</span>
                    ) : selectedTrack === 'beta' ? (
                      <span style={{ color: '#0284c7', fontWeight: 700 }}>5 Pilot Outlets</span>
                    ) : (
                      <span>{ver.rollout_pct || 100}% Rollout</span>
                    )}
                  </td>
                  <td style={{ padding: '1.15rem 1.4rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                      {selectedTrack === 'internal' && (
                        <button
                          onClick={() => handlePromote(ver.id, 'beta')}
                          disabled={promotingId === ver.id}
                          style={{
                            padding: '0.45rem 0.95rem',
                            borderRadius: '8px',
                            border: '1px solid #bae6fd',
                            backgroundColor: '#f0f9ff',
                            color: '#0284c7',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Promote to Beta →
                        </button>
                      )}

                      {selectedTrack === 'beta' && (
                        <button
                          onClick={() => handlePromote(ver.id, 'stable')}
                          disabled={promotingId === ver.id}
                          style={{
                            padding: '0.45rem 0.95rem',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#0f172a',
                            color: '#ffffff',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Promote to Production →
                        </button>
                      )}

                      {selectedTrack === 'production' && ver.status === 'in_review' && (
                        <a
                          href={`${ADMIN_URL}/review-queue`}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            backgroundColor: '#0f172a',
                            color: '#ffffff',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                        >
                          Audit in Admin →
                        </a>
                      )}

                      {selectedTrack === 'production' && ver.status === 'published' && (
                        <a
                          href={`${STORE_URL}/apps/${ver.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#0f172a',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                        >
                          View in Store ↗
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
