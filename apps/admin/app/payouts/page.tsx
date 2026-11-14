'use client';
import React, { useState, useEffect } from 'react';
import { API_URL, ADMIN_URL, STORE_URL } from '../config';
import { useAuthGuard } from '../useAuthGuard';
import { PageSkeleton } from '../components/PageSkeleton';
import { AdminHeader } from '../components/AdminHeader';

interface DeveloperPayoutItem {
  developerId: string;
  name: string;
  email: string;
  revenueSharePct: number;
  bankConfigured: boolean;
  bank: {
    accountHolder: string;
    bankName: string;
    accountNumber: string;
    fullAccountNumber: string;
    ifsc: string;
    pan: string;
    gstin: string | null;
  } | null;
  payoutRef: string | null;
  grossRevenue: number;
  platformFee: number;
  devShare: number;
  tdsWithheld: number;
  netPayable: number;
  activeSubscribers: number;
}

interface PayoutHistoryItem {
  id: string;
  developer_name: string;
  developer_email: string;
  bank_name: string;
  bank_ifsc: string;
  bank_account_number: string;
  period_start: string;
  period_end: string;
  gross: string;
  platform_fee: string;
  tds: string;
  net: string;
  status: string;
  provider_ref: string;
}

interface OverviewData {
  summary: {
    totalGrossMrr: number;
    platformProfit: number;
    tdsWithheld: number;
    netPayableToDevelopers: number;
    totalPartners: number;
    readyForPayoutCount: number;
  };
  developers: DeveloperPayoutItem[];
  history: PayoutHistoryItem[];
}

export default function AdminPayoutsPage() {
  const { authorized, checking } = useAuthGuard('admin');
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingDevId, setPayingDevId] = useState<string | null>(null);
  const [selectedBankModal, setSelectedBankModal] = useState<DeveloperPayoutItem | null>(null);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fetchOverview = () => {
    setLoading(true);
    fetch(`${API_URL}/admin/payouts/overview`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load payout overview:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (authorized) fetchOverview();
  }, [authorized]);

  const handlePayDirect = async (dev: DeveloperPayoutItem) => {
    if (!dev.bankConfigured) {
      alert(`${dev.name} has not linked a bank account yet!`);
      return;
    }
    const confirmTransfer = confirm(
      `Confirm direct bank settlement of ₹${dev.netPayable.toLocaleString()} to ${dev.name}?\n` +
      `Bank: ${dev.bank?.bankName || 'HDFC Bank'}\n` +
      `A/C: ${dev.bank?.accountNumber || dev.payoutRef}\n` +
      `IFSC: ${dev.bank?.ifsc || 'N/A'}`
    );
    if (!confirmTransfer) return;

    setPayingDevId(dev.developerId);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/admin/payouts/pay/${dev.developerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: dev.grossRevenue })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Payment execution failed');

      setFeedback({
        msg: `✅ Payment of ₹${dev.netPayable.toLocaleString()} transferred to ${dev.name}! ${resData.message}`,
        type: 'success'
      });
      fetchOverview();
    } catch (err: any) {
      setFeedback({ msg: `❌ ${err.message}`, type: 'error' });
    } finally {
      setPayingDevId(null);
    }
  };

  if (checking || !authorized) {
    return (
      <PageSkeleton
        title="Admin Financial Ledger & Settlements"
        subtitle="Verifying cryptographic tokens and banking settlement permissions..."
      />
    );
  }

  const summary = data?.summary || {
    totalGrossMrr: 0,
    platformProfit: 0,
    tdsWithheld: 0,
    netPayableToDevelopers: 0,
    totalPartners: 0,
    readyForPayoutCount: 0
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', backgroundColor: '#faf5f8', color: '#0f172a', minHeight: '100vh' }}>
      {/* Top Header */}
      <AdminHeader currentTab="payouts" />

      {/* Main Content */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
              Developer Banking & Direct Payouts Gateway
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              Audit developer bank accounts, tax filings (PAN/GSTIN), and disburse 80% net royalties directly via Razorpay Route / NEFT.
            </p>
          </div>
          <button
            onClick={fetchOverview}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ↻ Refresh Ledger
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

        {/* 4 Overview Financial Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #fbcfe8', borderRadius: '16px', padding: '1.35rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Total Merchant Gross Sales
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
              ₹{Number(summary.totalGrossMrr).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>From POS App Store Purchases</div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #fbcfe8', borderRadius: '16px', padding: '1.35rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Platform Margin (20%)
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284c7' }}>
              ₹{Number(summary.platformProfit).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>BizBox Net Operating Profit</div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #fbcfe8', borderRadius: '16px', padding: '1.35rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#b91c1c', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              TDS Withheld (10%)
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b91c1c' }}>
              ₹{Number(summary.tdsWithheld).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>Section 194J Software Royalties</div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '1.35rem', background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' }}>
            <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Net Payable to Developers
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d' }}>
              ₹{Number(summary.netPayableToDevelopers).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.2rem', fontWeight: 700 }}>
              {summary.readyForPayoutCount} Accounts Ready to Transfer
            </div>
          </div>
        </div>

        {/* Live Developers Settlement Table */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #fbcfe8', borderRadius: '16px', overflow: 'hidden', marginBottom: '2.5rem' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #fbcfe8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Partner Developers Settlement Ledger
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Payments dispatched directly to registered Indian Bank Accounts
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #fbcfe8' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Developer</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Linked Bank & IFSC</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Gross Sales</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>BizBox (20%)</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>TDS (10%)</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Net Payable</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    Loading real-time financial ledger from database...
                  </td>
                </tr>
              ) : (!data?.developers || data.developers.length === 0) ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    No developer accounts found.
                  </td>
                </tr>
              ) : (
                data.developers.map(dev => (
                  <tr key={dev.developerId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>{dev.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{dev.email} • {dev.activeSubscribers} POS Subscribers</div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      {dev.bankConfigured ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                              {dev.bank?.bankName || 'Verified Bank'}
                            </span>
                            <span style={{ fontSize: '0.65rem', backgroundColor: '#dcfce7', color: '#15803d', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                              ✓ LINKED
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '0.15rem' }}>
                            A/C: <code>{dev.bank?.accountNumber || dev.payoutRef}</code> • IFSC: <code>{dev.bank?.ifsc || 'N/A'}</code>
                          </div>
                          <button
                            onClick={() => setSelectedBankModal(dev)}
                            style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.7rem', fontWeight: 600, padding: 0, marginTop: '0.2rem', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            View Full Bank & PAN Details →
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 600, backgroundColor: '#fef2f2', padding: '3px 8px', borderRadius: '6px' }}>
                          ⚠️ Bank Not Linked
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                      ₹{dev.grossRevenue.toLocaleString()}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: '#0284c7', fontWeight: 600 }}>
                      ₹{dev.platformFee.toLocaleString()}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: '#b91c1c', fontWeight: 600 }}>
                      -₹{dev.tdsWithheld.toLocaleString()}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.95rem', fontWeight: 800, color: '#15803d' }}>
                      ₹{dev.netPayable.toLocaleString()}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handlePayDirect(dev)}
                        disabled={payingDevId === dev.developerId || !dev.bankConfigured || dev.netPayable <= 0}
                        style={{
                          padding: '0.5rem 1.15rem',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: (!dev.bankConfigured || dev.netPayable <= 0) ? '#e2e8f0' : '#16a34a',
                          color: (!dev.bankConfigured || dev.netPayable <= 0) ? '#94a3b8' : '#ffffff',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: (!dev.bankConfigured || dev.netPayable <= 0) ? 'not-allowed' : 'pointer',
                          boxShadow: (!dev.bankConfigured || dev.netPayable <= 0) ? 'none' : '0 2px 8px rgba(22, 163, 74, 0.3)'
                        }}
                      >
                        {payingDevId === dev.developerId ? 'Transferring...' : `Pay ₹${dev.netPayable.toLocaleString()} Now →`}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal: Full Bank & PAN Inspection */}
        {selectedBankModal && (
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
              maxWidth: '500px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Bank Details: {selectedBankModal.name}
                </h3>
                <button onClick={() => setSelectedBankModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}>
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #fbcfe8' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Beneficiary Legal Name</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>
                    {selectedBankModal.bank?.accountHolder || selectedBankModal.name}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #fbcfe8' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Bank Name</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>
                      {selectedBankModal.bank?.bankName || 'HDFC Bank'}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #fbcfe8' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>IFSC Code</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>
                      <code>{selectedBankModal.bank?.ifsc || 'N/A'}</code>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #fbcfe8' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Account Number</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem', fontFamily: 'monospace' }}>
                    {selectedBankModal.bank?.fullAccountNumber || selectedBankModal.payoutRef}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #fbcfe8' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Income Tax PAN</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>
                      <code>{selectedBankModal.bank?.pan || 'N/A'}</code>
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #fbcfe8' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>GSTIN</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>
                      <code>{selectedBankModal.bank?.gstin || 'Not registered'}</code>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setSelectedBankModal(null)}
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
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
