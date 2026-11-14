'use client';
import React from 'react';
import { ADMIN_URL, STORE_URL, DEV_URL } from '../config';

interface AdminHeaderProps {
  currentTab: 'review' | 'developers' | 'payouts' | 'metrics';
  devCount?: number;
  pendingReviewsCount?: number;
}

export function AdminHeader({ currentTab, devCount = 13, pendingReviewsCount }: AdminHeaderProps) {
  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #fbcfe8',
      padding: '0 1.75rem',
      minHeight: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 10px rgba(236, 72, 153, 0.05)'
    }}>
      {/* Left Brand & Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
        <a href={`${ADMIN_URL}/review-queue`} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '1.2rem',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(236, 72, 153, 0.35)'
          }}>
            B
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>BizBox</span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              color: '#db2777',
              backgroundColor: '#fce7f3',
              border: '1px solid #fbcfe8',
              padding: '2px 7px',
              borderRadius: '5px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>Admin</span>
          </div>
        </a>

        {/* Navigation Tabs with Pink & White Active Pills */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <a
            href={`${ADMIN_URL}/review-queue`}
            style={{
              padding: '0.5rem 0.95rem',
              borderRadius: '10px',
              backgroundColor: currentTab === 'review' ? '#fdf2f8' : 'transparent',
              color: currentTab === 'review' ? '#db2777' : '#64748b',
              border: currentTab === 'review' ? '1px solid #fbcfe8' : '1px solid transparent',
              fontWeight: currentTab === 'review' ? 800 : 600,
              fontSize: '0.84rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🛡️ Review Queue</span>
            {pendingReviewsCount !== undefined && pendingReviewsCount > 0 && (
              <span style={{
                backgroundColor: '#ec4899',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: '999px'
              }}>
                {pendingReviewsCount}
              </span>
            )}
          </a>

          <a
            href={`${ADMIN_URL}/developers`}
            style={{
              padding: '0.5rem 0.95rem',
              borderRadius: '10px',
              backgroundColor: currentTab === 'developers' ? '#fdf2f8' : 'transparent',
              color: currentTab === 'developers' ? '#db2777' : '#64748b',
              border: currentTab === 'developers' ? '1px solid #fbcfe8' : '1px solid transparent',
              fontWeight: currentTab === 'developers' ? 800 : 600,
              fontSize: '0.84rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.15s ease'
            }}
          >
            <span>👥 Developers & Partners</span>
            <span style={{
              backgroundColor: currentTab === 'developers' ? '#db2777' : '#e2e8f0',
              color: currentTab === 'developers' ? '#ffffff' : '#475569',
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: '999px'
            }}>
              {devCount}
            </span>
          </a>

          <a
            href={`${ADMIN_URL}/payouts`}
            style={{
              padding: '0.5rem 0.95rem',
              borderRadius: '10px',
              backgroundColor: currentTab === 'payouts' ? '#fdf2f8' : 'transparent',
              color: currentTab === 'payouts' ? '#db2777' : '#64748b',
              border: currentTab === 'payouts' ? '1px solid #fbcfe8' : '1px solid transparent',
              fontWeight: currentTab === 'payouts' ? 800 : 600,
              fontSize: '0.84rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <span>💳 Developer Payouts</span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              backgroundColor: '#dcfce7',
              color: '#15803d',
              padding: '1px 6px',
              borderRadius: '999px',
              border: '1px solid #bbf7d0'
            }}>
              80/20
            </span>
          </a>

          <a
            href={`${ADMIN_URL}/dashboard`}
            style={{
              padding: '0.5rem 0.95rem',
              borderRadius: '10px',
              backgroundColor: currentTab === 'metrics' ? '#fdf2f8' : 'transparent',
              color: currentTab === 'metrics' ? '#db2777' : '#64748b',
              border: currentTab === 'metrics' ? '1px solid #fbcfe8' : '1px solid transparent',
              fontWeight: currentTab === 'metrics' ? 800 : 600,
              fontSize: '0.84rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <span>📊 Store Metrics</span>
          </a>
        </nav>
      </div>

      {/* Right User & Cross Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <a
          href={STORE_URL}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#64748b',
            textDecoration: 'none',
            padding: '0.4rem 0.75rem',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0'
          }}
        >
          Public Store ↗
        </a>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.4rem 0.85rem',
          backgroundColor: '#faf5f8',
          border: '1px solid #fbcfe8',
          borderRadius: '12px'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            fontWeight: 900
          }}>
            F
          </div>
          <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>FlutterFlirt Admin</div>
            <div style={{ fontSize: '0.68rem', color: '#db2777', fontWeight: 700 }}>Store Platform Lead</div>
          </div>
        </div>
      </div>
    </header>
  );
}
