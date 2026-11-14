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
      const res = await fetch(`${API_URL}/dev/versions/${versionId}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner explaining Play Store Release Lifecycle */}
      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🚀</span>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Release Tracks & Testing Lifecycle
            </h2>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              padding: '2px 8px',
              borderRadius: '999px'
            }}>Google Play Standard</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
            Test your app builds safely before public release. Start with <strong>Internal Testing</strong> for your dev team, promote to <strong>Closed Beta</strong> for friendly partner merchants, and finally submit to <strong>Production Review</strong>.
          </p>
        </div>

        <button
          onClick={() => onOpenPublish(undefined, selectedTrack === 'beta' ? 'beta' : 'internal')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: '#ec4899',
            color: '#ffffff',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(236, 72, 153, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <span>+ Create Release in {selectedTrack === 'internal' ? 'Internal' : selectedTrack === 'beta' ? 'Beta' : 'Production'}</span>
        </button>
      </div>

      {/* Track Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setSelectedTrack('internal')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: selectedTrack === 'internal' ? '#0f172a' : '#f1f5f9',
            color: selectedTrack === 'internal' ? '#ffffff' : '#475569',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>🧪 Internal Testing</span>
          <span style={{
            fontSize: '0.7rem',
            padding: '1px 6px',
            borderRadius: '999px',
            backgroundColor: selectedTrack === 'internal' ? '#334155' : '#e2e8f0',
            color: selectedTrack === 'internal' ? '#ffffff' : '#64748b'
          }}>
            {internalVersions.length}
          </span>
        </button>

        <button
          onClick={() => setSelectedTrack('beta')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: selectedTrack === 'beta' ? '#0f172a' : '#f1f5f9',
            color: selectedTrack === 'beta' ? '#ffffff' : '#475569',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>👥 Closed Beta Track</span>
          <span style={{
            fontSize: '0.7rem',
            padding: '1px 6px',
            borderRadius: '999px',
            backgroundColor: selectedTrack === 'beta' ? '#334155' : '#e2e8f0',
            color: selectedTrack === 'beta' ? '#ffffff' : '#64748b'
          }}>
            {betaVersions.length}
          </span>
        </button>

        <button
          onClick={() => setSelectedTrack('production')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: selectedTrack === 'production' ? '#0f172a' : '#f1f5f9',
            color: selectedTrack === 'production' ? '#ffffff' : '#475569',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>🌐 Production Releases</span>
          <span style={{
            fontSize: '0.7rem',
            padding: '1px 6px',
            borderRadius: '999px',
            backgroundColor: selectedTrack === 'production' ? '#334155' : '#e2e8f0',
            color: selectedTrack === 'production' ? '#ffffff' : '#64748b'
          }}>
            {productionVersions.length}
          </span>
        </button>
      </div>

      {/* Track Explanation Card */}
      <div style={{
        padding: '1rem 1.25rem',
        borderRadius: '10px',
        backgroundColor: selectedTrack === 'internal' ? '#f0fdf4' : selectedTrack === 'beta' ? '#f0f9ff' : '#fdf2f8',
        border: `1px solid ${selectedTrack === 'internal' ? '#bbf7d0' : selectedTrack === 'beta' ? '#bae6fd' : '#fbcfe8'}`,
        fontSize: '0.82rem',
        color: selectedTrack === 'internal' ? '#166534' : selectedTrack === 'beta' ? '#0369a1' : '#9d174d'
      }}>
        {selectedTrack === 'internal' && (
          <div>
            <strong>Internal Track Rules:</strong> Upload builds for immediate internal sandbox verification. Does not require admin review. Ready instantly for your team testers.
          </div>
        )}
        {selectedTrack === 'beta' && (
          <div>
            <strong>Closed Beta Rules:</strong> Invite selected pilot restaurant merchants via test link. Gather real telemetry and user feedback before applying for public store publication.
          </div>
        )}
        {selectedTrack === 'production' && (
          <div>
            <strong>Production Track Rules:</strong> Releases are signed cryptographically with Ed25519 Cosign and submitted to the Admin Security Queue before publishing with staged rollout (10% → 100%).
          </div>
        )}
      </div>

      {/* Version Table */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Version & App</th>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Track Status</th>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Release Notes</th>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Testers / Rollout</th>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  No releases currently in <strong>{selectedTrack.toUpperCase()}</strong> track.
                  <div style={{ marginTop: '0.5rem' }}>
                    <button
                      onClick={() => onOpenPublish(undefined, selectedTrack === 'beta' ? 'beta' : 'internal')}
                      style={{
                        padding: '0.45rem 0.95rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        fontWeight: 600,
                        fontSize: '0.78rem',
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
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                      {ver.app_name} <span style={{ color: '#ec4899' }}>v{ver.version}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{ver.package_id}</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
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
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: '#475569', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ver.release_notes || 'Internal test build'}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>
                    {selectedTrack === 'internal' ? (
                      <span style={{ color: '#16a34a' }}>✓ Sandbox Active (Unlimited)</span>
                    ) : selectedTrack === 'beta' ? (
                      <span style={{ color: '#0284c7' }}>5 Pilot Outlets</span>
                    ) : (
                      <span>{ver.rollout_pct || 100}% Rollout</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                      {selectedTrack === 'internal' && (
                        <button
                          onClick={() => handlePromote(ver.id, 'beta')}
                          disabled={promotingId === ver.id}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #bae6fd',
                            backgroundColor: '#f0f9ff',
                            color: '#0284c7',
                            fontSize: '0.75rem',
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
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#0f172a',
                            color: '#ffffff',
                            fontSize: '0.75rem',
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
                      )}

                      {selectedTrack === 'production' && ver.status === 'published' && (
                        <a
                          href={`${STORE_URL}/apps/${ver.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#0f172a',
                            fontSize: '0.75rem',
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
