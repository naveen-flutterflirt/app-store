'use client';
import React, { useState, useEffect } from 'react';
import { API_URL, STORE_URL, ADMIN_URL } from '../config';
import { useAuthGuard } from '../useAuthGuard';
import { PageSkeleton } from '../components/PageSkeleton';
import { AdminHeader } from '../components/AdminHeader';

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'bank_linked'>('all');
  const [selectedDev, setSelectedDev] = useState<DeveloperItem | null>(null);

  const fetchDevelopers = async () => {
    setLoading(true);
    try {
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
        subtitle="Verifying directory permissions & ecosystem ledger..."
      />
    );
  }

  // Filter developers based on search & filter tabs
  const filteredDevs = developers.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.slug && d.slug.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'verified') return d.is_verified;
    if (statusFilter === 'bank_linked') return Boolean(d.bank_account_number);
    return true;
  });

  const totalRegisteredDevs = developers.length;
  const totalPartnerApps = developers.reduce((acc, d) => acc + (Number(d.total_apps) || 0), 0);
  const totalActiveInstalls = developers.reduce((acc, d) => acc + (Number(d.total_installs) || 0), 0);
  const totalBankLinked = developers.filter(d => Boolean(d.bank_account_number)).length;

  return (
    <div style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', backgroundColor: '#faf5f8', color: '#0f172a', minHeight: '100vh' }}>
      {/* Top Navbar */}
      <AdminHeader currentTab="developers" devCount={totalRegisteredDevs} />

      {/* Main Container */}
      <main style={{ maxWidth: '1360px', margin: '0 auto', padding: '2.25rem 2rem' }}>
        
        {/* Page Hero Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.025em' }}>
                Developers & Partner Ecosystem
              </h1>
              <span style={{
                backgroundColor: '#fce7f3',
                color: '#db2777',
                border: '1px solid #fbcfe8',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '999px'
              }}>
                {totalRegisteredDevs} Organizations
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
              Audit developer onboarding, linked payout bank accounts, and merchant POS deployment tracks.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={fetchDevelopers}
              style={{
                padding: '0.6rem 1.15rem',
                borderRadius: '10px',
                border: '1px solid #fbcfe8',
                backgroundColor: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#db2777',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease'
              }}
            >
              <span>↻</span> Refresh Directory
            </button>
          </div>
        </div>

        {/* 3 Spacious Executive KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {/* Card 1 */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fffbfd 100%)',
            border: '1px solid #fbcfe8',
            borderRadius: '18px',
            padding: '1.4rem 1.6rem',
            boxShadow: '0 4px 16px rgba(236, 72, 153, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                Registered Developers
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                {totalRegisteredDevs}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span>✓</span> {totalBankLinked} linked payout bank accounts
              </div>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#fdf2f8',
              border: '1px solid #fbcfe8',
              color: '#db2777',
              fontSize: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              🏢
            </div>
          </div>

          {/* Card 2 */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fffbfd 100%)',
            border: '1px solid #fbcfe8',
            borderRadius: '18px',
            padding: '1.4rem 1.6rem',
            boxShadow: '0 4px 16px rgba(236, 72, 153, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                Ecosystem Applications
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                {totalPartnerApps}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700, marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span>⚡</span> Production, Beta & Sandbox Packages
              </div>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#2563eb',
              fontSize: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              📦
            </div>
          </div>

          {/* Card 3 */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fffbfd 100%)',
            border: '1px solid #fbcfe8',
            borderRadius: '18px',
            padding: '1.4rem 1.6rem',
            boxShadow: '0 4px 16px rgba(236, 72, 153, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                Total POS Installs
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                {totalActiveInstalls.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#db2777', fontWeight: 700, marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span>💰</span> 80% Developer Share • 20% Platform
              </div>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              🛍️
            </div>
          </div>
        </div>

        {/* Clean Filter & Search Toolbar */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #fbcfe8',
          borderRadius: '16px',
          padding: '0.9rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: '280px', maxWidth: '460px' }}>
            <span style={{ fontSize: '1rem', color: '#94a3b8' }}>🔍</span>
            <input
              type="text"
              placeholder="Search by name, organization slug, or work email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '0.86rem',
                color: '#0f172a',
                backgroundColor: 'transparent'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  padding: '2px 6px'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', marginRight: '0.35rem' }}>FILTER:</span>
            
            <button
              onClick={() => setStatusFilter('all')}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '8px',
                border: statusFilter === 'all' ? '1px solid #fbcfe8' : '1px solid transparent',
                backgroundColor: statusFilter === 'all' ? '#fdf2f8' : '#f8fafc',
                color: statusFilter === 'all' ? '#db2777' : '#64748b',
                fontSize: '0.76rem',
                fontWeight: statusFilter === 'all' ? 800 : 600,
                cursor: 'pointer'
              }}
            >
              All ({developers.length})
            </button>

            <button
              onClick={() => setStatusFilter('bank_linked')}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '8px',
                border: statusFilter === 'bank_linked' ? '1px solid #bbf7d0' : '1px solid transparent',
                backgroundColor: statusFilter === 'bank_linked' ? '#dcfce7' : '#f8fafc',
                color: statusFilter === 'bank_linked' ? '#15803d' : '#64748b',
                fontSize: '0.76rem',
                fontWeight: statusFilter === 'bank_linked' ? 800 : 600,
                cursor: 'pointer'
              }}
            >
              Bank Linked ({totalBankLinked})
            </button>

            <button
              onClick={() => setStatusFilter('verified')}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '8px',
                border: statusFilter === 'verified' ? '1px solid #bae6fd' : '1px solid transparent',
                backgroundColor: statusFilter === 'verified' ? '#e0f2fe' : '#f8fafc',
                color: statusFilter === 'verified' ? '#0369a1' : '#64748b',
                fontSize: '0.76rem',
                fontWeight: statusFilter === 'verified' ? 800 : 600,
                cursor: 'pointer'
              }}
            >
              Verified Partners ({developers.filter(d => d.is_verified).length})
            </button>
          </div>
        </div>

        {/* Spacious, Decluttered Developers Table (5 Clean Columns) */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #fbcfe8',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(236, 72, 153, 0.04)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#fff5f9', borderBottom: '1px solid #fce7f3' }}>
                <th style={{ padding: '1rem 1.5rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.72rem', fontWeight: 800, width: '30%' }}>
                  Developer Organization
                </th>
                <th style={{ padding: '1rem 1.25rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.72rem', fontWeight: 800, width: '22%' }}>
                  Payout Bank Details
                </th>
                <th style={{ padding: '1rem 1.25rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.72rem', fontWeight: 800, width: '24%' }}>
                  App Catalog & Release Tracks
                </th>
                <th style={{ padding: '1rem 1.25rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.72rem', fontWeight: 800, width: '12%' }}>
                  POS Installs
                </th>
                <th style={{ padding: '1rem 1.5rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.72rem', fontWeight: 800, textAlign: 'right', width: '12%' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⏳</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading partner developers directory...</div>
                  </td>
                </tr>
              ) : filteredDevs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🔍</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>No developers match your filters</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Try clearing the search query or changing the filter chip.</div>
                  </td>
                </tr>
              ) : (
                filteredDevs.map(dev => {
                  // Format developer name cleanly if it has a long timestamp
                  const cleanName = dev.name;
                  const initials = (dev.name.trim().split(' ').map(w => w[0]).join('').slice(0, 2) || 'DV').toUpperCase();

                  return (
                    <tr
                      key={dev.id}
                      style={{
                        borderBottom: '1px solid #f8fafc',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fffafc')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Column 1: Developer Organization & Contact (Stacked cleanly) */}
                      <td style={{ padding: '1.2rem 1.5rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
                            color: '#db2777',
                            border: '1px solid #fbcfe8',
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                                {cleanName}
                              </span>
                              {dev.is_verified ? (
                                <span style={{
                                  fontSize: '0.66rem',
                                  fontWeight: 800,
                                  backgroundColor: '#dcfce7',
                                  color: '#15803d',
                                  border: '1px solid #bbf7d0',
                                  padding: '1px 7px',
                                  borderRadius: '999px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem'
                                }}>
                                  ✓ Verified
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '0.66rem',
                                  fontWeight: 700,
                                  backgroundColor: '#f1f5f9',
                                  color: '#64748b',
                                  padding: '1px 7px',
                                  borderRadius: '999px'
                                }}>
                                  Standard
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <span style={{ color: '#0f172a', fontWeight: 500 }}>{dev.email}</span>
                              {dev.website && (
                                <>
                                  <span style={{ color: '#cbd5e1' }}>•</span>
                                  <a
                                    href={dev.website.startsWith('http') ? dev.website : `https://${dev.website}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: '#0284c7', textDecoration: 'none', fontSize: '0.75rem' }}
                                  >
                                    🌐 {dev.website.replace(/^https?:\/\//, '')}
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Payout Bank Details (Single, neat container) */}
                      <td style={{ padding: '1.2rem 1.25rem', verticalAlign: 'middle' }}>
                        {dev.bank_account_number ? (
                          <div
                            onClick={() => setSelectedDev(dev)}
                            style={{
                              backgroundColor: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: '10px',
                              padding: '0.5rem 0.75rem',
                              display: 'inline-flex',
                              flexDirection: 'column',
                              gap: '0.2rem',
                              cursor: 'pointer',
                              maxWidth: '240px'
                            }}
                            title="Click to view full bank details & IFSC"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 800 }}>🏦 {dev.bank_name || 'Bank Account'}</span>
                              <span style={{ fontSize: '0.62rem', backgroundColor: '#dcfce7', color: '#166534', fontWeight: 800, padding: '1px 5px', borderRadius: '4px' }}>
                                LINKED
                              </span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#334155', fontFamily: 'monospace' }}>
                              ****{dev.bank_account_number.slice(-4)} • {dev.bank_ifsc || 'IFSC'}
                            </div>
                          </div>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            color: '#94a3b8',
                            backgroundColor: '#f8fafc',
                            border: '1px dashed #cbd5e1',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '8px'
                          }}>
                            <span>⚠️</span> Not linked yet
                          </span>
                        )}
                      </td>

                      {/* Column 3: App Catalog & Release Tracks (Total + sleek single line pill) */}
                      <td style={{ padding: '1.2rem 1.25rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                            {dev.total_apps} {dev.total_apps === 1 ? 'Application' : 'Applications'}
                          </div>
                          
                          {/* Horizontal Compact Track Indicators */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <span style={{
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '5px',
                              border: '1px solid #bbf7d0'
                            }}>
                              {dev.live_apps} Live
                            </span>
                            <span style={{
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '5px',
                              border: '1px solid #bae6fd'
                            }}>
                              {dev.testing_apps} Beta
                            </span>
                            <span style={{
                              backgroundColor: '#fef3c7',
                              color: '#b45309',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '5px',
                              border: '1px solid #fde68a'
                            }}>
                              {dev.draft_apps} Draft
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 4: Installs Count */}
                      <td style={{ padding: '1.2rem 1.25rem', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                          {dev.total_installs.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>active terminals</div>
                      </td>

                      {/* Column 5: Right-aligned Action Button */}
                      <td style={{ padding: '1.2rem 1.5rem', textAlign: 'right', verticalAlign: 'middle' }}>
                        <button
                          onClick={() => setSelectedDev(dev)}
                          style={{
                            padding: '0.55rem 1.1rem',
                            borderRadius: '10px',
                            border: '1px solid #fbcfe8',
                            backgroundColor: '#fdf2f8',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            color: '#db2777',
                            boxShadow: '0 2px 6px rgba(236, 72, 153, 0.08)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>Manage Dev</span>
                          <span style={{ fontSize: '0.85rem' }}>→</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Custom Luxury Modal: Inspect Developer Details & Applications */}
        {selectedDev && (
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
              maxWidth: '740px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -15px rgba(236, 72, 153, 0.25)',
              border: '1px solid #fbcfe8',
              padding: '2rem'
            }}>
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid #fce7f3', paddingBottom: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {(selectedDev.name.slice(0, 2) || 'DV').toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                        {selectedDev.name}
                      </h2>
                      <span style={{ fontSize: '0.68rem', backgroundColor: '#fdf2f8', color: '#db2777', border: '1px solid #fbcfe8', padding: '2px 8px', borderRadius: '999px', fontWeight: 800 }}>
                        {selectedDev.type.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                      Email: <strong style={{ color: '#0f172a' }}>{selectedDev.email}</strong> • Revenue Share: <strong style={{ color: '#db2777' }}>{selectedDev.revenue_share_pct}%</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDev(null)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Bank & Statutory Payout Details Card */}
              <div style={{
                marginBottom: '1.75rem',
                padding: '1.25rem 1.4rem',
                borderRadius: '14px',
                backgroundColor: selectedDev.bank_account_number ? '#f0fdf4' : '#f8fafc',
                border: selectedDev.bank_account_number ? '1px solid #bbf7d0' : '1px dashed #cbd5e1'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.15rem' }}>🏦</span>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Banking & Razorpay Settlement Account
                    </h3>
                  </div>
                  {selectedDev.bank_account_number ? (
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '999px' }}>
                      ✓ VERIFIED FOR 80% AUTOMATED PAYOUTS
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '999px' }}>
                      NOT CONFIGURED
                    </span>
                  )}
                </div>

                {selectedDev.bank_account_number ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    <div style={{ backgroundColor: '#ffffff', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Beneficiary Name</div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{selectedDev.bank_account_holder || '—'}</div>
                    </div>
                    <div style={{ backgroundColor: '#ffffff', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Bank & Account No.</div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                        {selectedDev.bank_name || 'Bank'}: <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{selectedDev.bank_account_number}</code>
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#ffffff', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>IFSC Code</div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                        <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{selectedDev.bank_ifsc || '—'}</code>
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#ffffff', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>PAN / GSTIN</div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                        <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{selectedDev.pan_number || '—'}</code>
                        {selectedDev.gstin && <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: '6px' }}>({selectedDev.gstin})</span>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                    This developer has not yet submitted their settlement bank account or statutory PAN/GSTIN credentials.
                  </p>
                )}
              </div>

              {/* Developer Applications List */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Applications Catalog ({selectedDev.apps_list?.length || 0})
                </h3>
              </div>

              {(!selectedDev.apps_list || selectedDev.apps_list.length === 0) ? (
                <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>📦</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>This developer has not created any applications yet.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {selectedDev.apps_list.map(app => (
                    <div key={app.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.15rem',
                      borderRadius: '12px',
                      border: '1px solid #fbcfe8',
                      backgroundColor: '#ffffff'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>{app.name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                          <code style={{ backgroundColor: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>{app.package_id}</code> • Category: {app.category} • v{app.last_version}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '3px 9px',
                          borderRadius: '999px',
                          backgroundColor: app.status === 'listed' ? '#dcfce7' : (app.status === 'draft' ? '#fef3c7' : '#f1f5f9'),
                          color: app.status === 'listed' ? '#15803d' : (app.status === 'draft' ? '#b45309' : '#475569')
                        }}>
                          ● {app.status.toUpperCase()}
                        </span>
                        <a
                          href={`${ADMIN_URL}/review-queue`}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#db2777',
                            textDecoration: 'none',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            backgroundColor: '#fdf2f8',
                            border: '1px solid #fbcfe8'
                          }}
                        >
                          Audit Queue →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Modal Footer */}
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setSelectedDev(null)}
                  style={{
                    padding: '0.55rem 1.5rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: '#334155'
                  }}
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
