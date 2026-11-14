'use client';
import React, { useState } from 'react';
import { API_URL, STORE_URL } from './config';

interface AppDetailModalProps {
  app: any;
  onClose: () => void;
  onOpenRelease: (app: any) => void;
  onRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function AppDetailModal({
  app,
  onClose,
  onOpenRelease,
  onRefresh,
  showToast
}: AppDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tracks' | 'listing' | 'analytics'>('overview');
  const [saving, setSaving] = useState(false);

  // Editable listing state
  const [tagline, setTagline] = useState(app.tagline || '');
  const [descriptionMd, setDescriptionMd] = useState(app.description_md || `# ${app.name}\n\nComprehensive business solution.`);
  const [category, setCategory] = useState(app.category || 'sales');

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '850px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* App Header Header */}
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#fdf2f8',
              border: '1px solid #fbcfe8',
              color: '#ec4899',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 800
            }}>
              {app.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  {app.name}
                </h2>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: app.status === 'listed' ? '#dcfce7' : '#fef3c7',
                  color: app.status === 'listed' ? '#15803d' : '#b45309'
                }}>
                  ● {app.status === 'listed' ? 'Published on Store' : 'Draft / In Development'}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                Package: {app.package_id} • Runtime: {app.runtime || 'Cloud/Edge'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => { onClose(); onOpenRelease(app); }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#ec4899',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(236, 72, 153, 0.25)'
              }}
            >
              + Create Release
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                color: '#64748b',
                cursor: 'pointer',
                padding: '0.25rem'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          padding: '0 2rem',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#ffffff'
        }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '0.85rem 0.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'overview' ? '2px solid #ec4899' : '2px solid transparent',
              color: activeTab === 'overview' ? '#ec4899' : '#64748b',
              fontWeight: activeTab === 'overview' ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Dashboard & Rollout
          </button>
          <button
            onClick={() => setActiveTab('tracks')}
            style={{
              padding: '0.85rem 0.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'tracks' ? '2px solid #ec4899' : '2px solid transparent',
              color: activeTab === 'tracks' ? '#ec4899' : '#64748b',
              fontWeight: activeTab === 'tracks' ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Testing Tracks (Play Store)
          </button>
          <button
            onClick={() => setActiveTab('listing')}
            style={{
              padding: '0.85rem 0.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'listing' ? '2px solid #ec4899' : '2px solid transparent',
              color: activeTab === 'listing' ? '#ec4899' : '#64748b',
              fontWeight: activeTab === 'listing' ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Store Listing & Pricing
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Quick Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Installed Outlets</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>{app.installs || 0}</div>
                  <div style={{ fontSize: '0.7rem', color: '#16a34a', marginTop: '0.2rem' }}>Verified Merchant POS</div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Active Version</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>v{app.last_version || '1.0.0'}</div>
                  <div style={{ fontSize: '0.7rem', color: '#0284c7', marginTop: '0.2rem' }}>Rollout: {app.rollout_pct || 0}%</div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Est. MRR (₹/mo)</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>₹{app.est_mrr || '0'}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>80% Dev Share</div>
                </div>
              </div>

              {/* Staged Rollout Banner */}
              <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '14px', padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 800, color: '#0369a1' }}>
                  Staged Rollout Status ({app.rollout_pct || 0}%)
                </h4>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#0284c7' }}>
                  Control what percentage of merchant POS devices receive this update. Hash-based tenant bucketing ensures reliable gradual rollouts.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => showToast(`Rollout staged to 10% pilot outlets`, 'success')}
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #0284c7', backgroundColor: '#ffffff', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    10% Pilot
                  </button>
                  <button
                    onClick={() => showToast(`Rollout expanded to 50% outlets`, 'success')}
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #0284c7', backgroundColor: '#ffffff', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    50% Expansion
                  </button>
                  <button
                    onClick={() => showToast(`Rollout released to 100% General Availability`, 'success')}
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    100% General Availability
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tracks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>🧪 Internal Testing Track</h4>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>For your dev team & local POS sandbox. No approval required.</span>
                  </div>
                  <button
                    onClick={() => { onClose(); onOpenRelease(app); }}
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    + Create Internal Build
                  </button>
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>👥 Closed Beta Track</h4>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Share test link with trusted partner restaurant owners.</span>
                  </div>
                  <button
                    onClick={() => showToast('Beta invite link copied to clipboard: https://app-store.bizbox.in/beta/invite/' + app.id, 'success')}
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #bae6fd', backgroundColor: '#f0f9ff', color: '#0369a1', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    📋 Copy Beta Invite Link
                  </button>
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#fdf2f8', borderRadius: '12px', border: '1px solid #fbcfe8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#9d174d' }}>🌐 Production Release Track</h4>
                    <span style={{ fontSize: '0.72rem', color: '#be185d' }}>Signed with Cosign Ed25519 & submitted to Admin Security Review.</span>
                  </div>
                  <a
                    href={`${STORE_URL}/apps/${app.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', backgroundColor: '#ec4899', color: '#ffffff', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none' }}
                  >
                    View in Public Store ↗
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'listing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                  Tagline / Short Summary
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                  Detailed Description (Markdown)
                </label>
                <textarea
                  rows={6}
                  value={descriptionMd}
                  onChange={e => setDescriptionMd(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontFamily: 'monospace', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => showToast('Listing details updated successfully!', 'success')}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
