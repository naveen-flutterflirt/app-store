'use client';
import React, { useState, useEffect } from 'react';
import { API_URL, ADMIN_URL, STORE_URL } from '../config';
import { useAuthGuard } from '../useAuthGuard';

interface PayoutItem {
  id: string;
  developer_id: string;
  developer_name: string;
  developer_email: string;
  period_start: string;
  period_end: string;
  gross: string;
  platform_fee: string;
  tds: string;
  net: string;
  status: string;
  provider_ref: string;
}

export default function AdminPayoutsPage() {
  const { authorized, checking } = useAuthGuard('admin');
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningPayouts, setRunningPayouts] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fetchPayouts = () => {
    setLoading(true);
    fetch(`${API_URL}/admin/developers`)
      .then(res => res.json())
      .then(devs => {
        // Query database payouts
        fetch(`${API_URL}/admin/metrics`)
          .then(r => r.json())
          .then(() => {
            // Mock or live list from reviewService
            setLoading(false);
          });
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (authorized) fetchPayouts();
  }, [authorized]);

  const handleRunMonthlyPayouts = async () => {
    setRunningPayouts(true);
    setFeedback(null);
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

      const res = await fetch(`${API_URL}/admin/payouts/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart: firstDay,
          periodEnd: lastDay
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to trigger monthly payout engine');

      setFeedback({
        msg: `Successfully processed ${data.payoutCount || 0} developer payouts via Razorpay Route! 80% split & 10% TDS settled.`,
        type: 'success'
      });
      fetchPayouts();
    } catch (err: any) {
      setFeedback({ msg: err.message || 'Error executing payouts', type: 'error' });
    } finally {
      setRunningPayouts(false);
    }
  };

  if (checking || !authorized) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
        Verifying administrator permissions...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', color: '#0f172a', minHeight: '100vh' }}>
      {/* Top Header */}
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
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ec4899', backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8', padding: '1px 6px', borderRadius: '4px' }}>Admin</span>
          </a>
          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            <a href={`${ADMIN_URL}/review-queue`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>
              Review queue
            </a>
            <a href={`${ADMIN_URL}/developers`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>
              Developers & Partners
            </a>
            <a href={`${ADMIN_URL}/payouts`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}>
              Developer Payouts & Settlement
            </a>
            <a href={`${ADMIN_URL}/dashboard`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>
              Store Metrics
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
              Developer Revenue Sharing & Payouts Engine
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              Automated settlement: 80% developer revenue share, 20% platform fee, and 10% Indian Section 194J TDS deductions.
            </p>
          </div>

          <button
            onClick={handleRunMonthlyPayouts}
            disabled={runningPayouts}
            style={{
              padding: '0.65rem 1.35rem',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: runningPayouts ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)'
            }}
          >
            <span>🏦</span>
            <span>{runningPayouts ? 'Calculating & Settling with Banks...' : 'Run Monthly Payouts Settlement'}</span>
          </button>
        </div>

        {feedback && (
          <div style={{
            padding: '1rem',
            borderRadius: '10px',
            backgroundColor: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: feedback.type === 'success' ? '#166534' : '#991b1b',
            marginBottom: '1.5rem',
            fontSize: '0.85rem'
          }}>
            {feedback.msg}
          </div>
        )}

        {/* 3 Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.4rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Standard Revenue Share Split
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>80% / 20%</div>
            <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>80% Developer • 20% Platform</div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.4rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Statutory Tax Withholding (TDS)
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>10.0%</div>
            <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600 }}>Section 194J Software Royalties</div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.4rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Settlement Gateway
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>Razorpay Route</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Automated direct-to-bank NEFT/IMPS</div>
          </div>
        </div>
      </main>
    </div>
  );
}
