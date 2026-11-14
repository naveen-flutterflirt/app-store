'use client';
import React, { useState, useEffect } from 'react';
import { API_URL, STORE_URL, ADMIN_URL } from '../config';
import { useAuthGuard } from '../useAuthGuard';
import { PageSkeleton } from '../components/PageSkeleton';
import { ADMIN_VERSION } from '../version';

interface DeveloperItem {
  id: string;
  name: string;
  slug: string;
  email: string;
  website: string | null;
  type: string;
  is_verified: boolean;
  revenue_share_pct: number;
  created_at: string;
  total_apps: number;
  draft_apps: number;
  testing_apps: number;
  live_apps: number;
  total_installs: number;
  est_mrr: string;
  payout_ref?: string | null;
  bank_account_holder?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
  pan_number?: string | null;
  gstin?: string | null;
  apps_list: Array<{
    id: string;
    name: string;
    package_id: string;
    category: string;
    status: string;
    last_version: string;
    rollout_pct: number;
  }>;
}

export default function AdminDevelopersPage() {
  const { authorized, checking } = useAuthGuard('admin');
  const [developers, setDevelopers] = useState<DeveloperItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDev, setSelectedDev] = useState<DeveloperItem | null>(null);

  const fetchDevelopers = async () => {
    setLoading(true);
    try {
      // Fetch both developers and payouts overview in parallel for instant, fail-safe bank account syncing
      const [devsRes, payoutsRes] = await Promise.all([
        fetch(`${API_URL}/admin/developers`),
        fetch(`${API_URL}/admin/payouts/overview`).catch(() => null)
      ]);

      const devsData = await devsRes.json();
      let payoutsData: any = null;
      if (payoutsRes && payoutsRes.ok) {
        payoutsData = await payoutsRes.json();
      }

      const payoutBankMap = new Map<string, any>();
      if (payoutsData?.developers && Array.isArray(payoutsData.developers)) {
        for (const p of payoutsData.developers) {
          if (p.developerId && p.bank) {
            payoutBankMap.set(p.developerId, p.bank);
          }
        }
      }

      if (Array.isArray(devsData)) {
        const enriched = devsData.map((d: DeveloperItem) => {
          const bank = payoutBankMap.get(d.id);
          return {
            ...d,
            bank_account_holder: d.bank_account_holder || bank?.accountHolder || null,
            bank_name: d.bank_name || bank?.bankName || null,
            bank_account_number: d.bank_account_number || bank?.fullAccountNumber || bank?.accountNumber || null,
            bank_ifsc: d.bank_ifsc || bank?.ifsc || null,
            pan_number: d.pan_number || bank?.pan || null,
            gstin: d.gstin || bank?.gstin || null,
          };
        });
        setDevelopers(enriched);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load developers:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      fetchDevelopers();
    }
  }, [authorized]);

  if (checking || !authorized) {
    return (
      <PageSkeleton
        title="Partner Developers Directory"
        subtitle="Verifying cryptographic tokens and directory access permissions..."
      />
    );
  }

  const filteredDevs = developers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.slug && d.slug.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalRegisteredDevs = developers.length;
  const totalPartnerApps = developers.reduce((acc, d) => acc + (Number(d.total_apps) || 0), 0);
  const totalActiveInstalls = developers.reduce((acc, d) => acc + (Number(d.total_installs) || 0), 0);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', color: '#0f172a', minHeight: '100vh' }}>
      {/* Top Navbar */}
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
          <a href={`${ADMIN_URL}/dashboard`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
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
          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            <a href={`${ADMIN_URL}/review-queue`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>
              Review queue
            </a>
            <a href={`${ADMIN_URL}/developers`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>Developers & Partners</span>
              <span style={{ backgroundColor: '#0284c7', color: '#ffffff', fontSize: '0.65rem', fontWeight: 800, padding: '1px 5px', borderRadius: '999px' }}>
                {totalRegisteredDevs}
              </span>
            </a>
            <a href={`${ADMIN_URL}/dashboard`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>
              Store Metrics
            </a>
            <a href={STORE_URL} target="_blank" rel="noreferrer" style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>
              Public Store ↗
            </a>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#ec4899', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>F</div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>FlutterFlirt Admin</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Store Platform Lead</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Header Title + Stats */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
              Registered Developers & Partner Ecosystem
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              Live visibility into all developers building apps, testing releases, and publishing to BizBox POS.
            </p>
          </div>
          <button
            onClick={fetchDevelopers}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span>🔄</span> Refresh Directory
          </button>
        </div>

        {/* 3 Overview KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.35rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Total Registered Developers
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>{totalRegisteredDevs}</div>
            <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600, marginTop: '0.2rem' }}>Verified Partner Organizations</div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.35rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Total Ecosystem Apps
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>{totalPartnerApps}</div>
            <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, marginTop: '0.2rem' }}>Production, Beta & Sandbox Packages</div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.35rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Ecosystem POS Installs
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>{totalActiveInstalls}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '0.2rem' }}>80% Developer Revenue Share Standard</div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '1.25rem' }}>
          <input
            type="text"
            placeholder="Search developers by name, organization slug, or work email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '0.65rem 1rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              backgroundColor: '#ffffff',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Developers Table */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Developer / Company</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Contact Email</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Bank Account & Payout</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Apps Building</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Live / Testing Split</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Installs</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    Loading partner developers directory...
                  </td>
                </tr>
              ) : filteredDevs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    No registered developers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredDevs.map(dev => (
                  <tr key={dev.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: '#e0f2fe',
                          color: '#0284c7',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {dev.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{dev.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            slug: <code>{dev.slug}</code> {dev.website && `• ${dev.website}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: '#334155' }}>
                      {dev.email}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {dev.bank_account_number ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a', backgroundColor: '#dcfce7', padding: '1px 6px', borderRadius: '4px' }}>
                              ✓ LINKED
                            </span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{dev.bank_name || 'Bank'}</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                            <code>****{dev.bank_account_number.slice(-4)}</code> • {dev.bank_ifsc || 'IFSC'}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          Not configured
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                        {dev.total_apps} apps
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px' }}>
                          {dev.live_apps} Published
                        </span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
                          {dev.testing_apps} Testing
                        </span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px' }}>
                          {dev.draft_apps} Draft
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                      {dev.total_installs}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '999px',
                        backgroundColor: dev.is_verified ? '#dcfce7' : '#f1f5f9',
                        color: dev.is_verified ? '#15803d' : '#475569'
                      }}>
                        ● {dev.is_verified ? 'Verified Partner' : 'Registered'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedDev(dev)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#0284c7',
                          cursor: 'pointer'
                        }}
                      >
                        Inspect Apps ({dev.total_apps}) →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal: Inspect Developer Apps */}
        {selectedDev && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '750px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '2rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {selectedDev.name}
                    </h2>
                    <span style={{ fontSize: '0.7rem', backgroundColor: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                      {selectedDev.type}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.35rem 0 0 0' }}>
                    Contact: <strong>{selectedDev.email}</strong> • Revenue Share: <strong>{selectedDev.revenue_share_pct}%</strong>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDev(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              {/* Bank & Tax Details Card */}
              <div style={{
                marginBottom: '1.5rem',
                padding: '1.25rem',
                borderRadius: '12px',
                backgroundColor: selectedDev.bank_account_number ? '#f0fdf4' : '#f8fafc',
                border: selectedDev.bank_account_number ? '1px solid #bbf7d0' : '1px dashed #cbd5e1'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>🏦</span>
                    <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Banking & Statutory Payout Details
                    </h3>
                  </div>
                  {selectedDev.bank_account_number ? (
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '999px' }}>
                      ✓ VERIFIED SETTLEMENT ACCOUNT
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '999px' }}>
                      PENDING SETUP
                    </span>
                  )}
                </div>

                {selectedDev.bank_account_number ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                    <div style={{ backgroundColor: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Account Holder</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{selectedDev.bank_account_holder || '—'}</div>
                    </div>
                    <div style={{ backgroundColor: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Bank & Account No.</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                        {selectedDev.bank_name || 'Bank'}: <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{selectedDev.bank_account_number}</code>
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>IFSC Code</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                        <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{selectedDev.bank_ifsc || '—'}</code>
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>PAN (Tax TDS 194J) / GSTIN</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                        <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{selectedDev.pan_number || '—'}</code>
                        {selectedDev.gstin && <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: '6px' }}>({selectedDev.gstin})</span>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                    Developer has not yet configured their bank account for automated royalty settlements.
                  </p>
                )}
              </div>

              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                Applications Owned by this Developer ({selectedDev.apps_list?.length || 0})
              </h3>

              {(!selectedDev.apps_list || selectedDev.apps_list.length === 0) ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                  This developer has not created any applications yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {selectedDev.apps_list.map(app => (
                    <div key={app.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{app.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          <code>{app.package_id}</code> • Category: {app.category} • Version: v{app.last_version}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '999px',
                          backgroundColor: app.status === 'listed' ? '#dcfce7' : (app.status === 'draft' ? '#fef3c7' : '#f1f5f9'),
                          color: app.status === 'listed' ? '#15803d' : (app.status === 'draft' ? '#b45309' : '#475569')
                        }}>
                          ● {app.status}
                        </span>
                        <a
                          href={`${ADMIN_URL}/review-queue`}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: '#0284c7',
                            textDecoration: 'none',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1'
                          }}
                        >
                          Review →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setSelectedDev(null)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

