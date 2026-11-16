'use client';
import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { API_URL, ADMIN_URL, STORE_URL } from '../config';
import { useAuthGuard } from '../useAuthGuard';
import { PageSkeleton } from '../components/PageSkeleton';
import { AdminHeader } from '../components/AdminHeader';

declare global {
  interface Window {
    Razorpay: any;
  }
}

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
  isPaid?: boolean;
  currentPayout?: {
    id: string;
    gross: number;
    platform_fee: number;
    tds: number;
    net: number;
    status: string;
    provider_ref: string;
    period_start: string;
  } | null;
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
  const [confirmPayoutModal, setConfirmPayoutModal] = useState<DeveloperPayoutItem | null>(null);
  const [noBankAlertModal, setNoBankAlertModal] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [localPaidDevIds, setLocalPaidDevIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('bizbox_paid_devs_cache');
        if (stored) return new Set(JSON.parse(stored));
      } catch (e) {}
    }
    return new Set();
  });

  const fetchOverview = () => {
    setLoading(true);
    fetch(`${API_URL}/admin/payouts/overview`)
      .then(res => res.json())
      .then(resData => {
        // Automatically check if any developer has a 'paid' record in the monthly history
        if (resData && Array.isArray(resData.history)) {
          const paidDevNames = new Set(
            resData.history
              .filter((h: any) => h.status === 'paid')
              .map((h: any) => h.developer_name?.toLowerCase())
          );
          if (Array.isArray(resData.developers)) {
            resData.developers = resData.developers.map((d: any) => {
              const matchesHistory = paidDevNames.has(d.name?.toLowerCase());
              if (matchesHistory) {
                d.isPaid = true;
              }
              return d;
            });
          }
        }
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

  const handlePayDirect = (dev: DeveloperPayoutItem) => {
    if (!dev.bankConfigured) {
      setNoBankAlertModal(dev.name);
      return;
    }
    setConfirmPayoutModal(dev);
  };

  const executeTransfer = async (dev: DeveloperPayoutItem) => {
    setConfirmPayoutModal(null);
    setPayingDevId(dev.developerId);
    setFeedback({
      msg: `🔄 Opening Razorpay Gateway for ${dev.name}...`,
      type: 'success'
    });
    try {
      // 1. Record the settlement transfer in backend API
      const res = await fetch(`${API_URL}/admin/payouts/pay/${dev.developerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: dev.grossRevenue })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Payment execution failed');

      // Optimistically mark this developer as paid in local state immediately
      setLocalPaidDevIds(prev => {
        const next = new Set(prev).add(dev.developerId);
        if (typeof window !== 'undefined') {
          localStorage.setItem('bizbox_paid_devs_cache', JSON.stringify(Array.from(next)));
        }
        return next;
      });

      // 2. Launch Razorpay Checkout Modal directly for Admin settlement
      const amountPaise = Math.round(dev.netPayable * 100);
      const rzpKey = "rzp_test_TyPXUT6fIYnLQ7";

      if (typeof window !== 'undefined' && window.Razorpay) {
        setFeedback({
          msg: `💳 Razorpay Checkout active for ₹${dev.netPayable.toLocaleString()} (${dev.name}). Complete payment below.`,
          type: 'success'
        });

        const rzp = new window.Razorpay({
          key: rzpKey,
          amount: amountPaise,
          currency: 'INR',
          name: 'BizBox App Store & Platform',
          description: `Developer Royalty Settlement - ${dev.name}`,
          image: 'https://app-store-mnlu.vercel.app/logo.png',
          prefill: {
            name: dev.name,
            email: dev.email || 'kitchenmetrics@example.com',
            contact: '+919876543210'
          },
          notes: {
            developer_id: dev.developerId,
            developer_name: dev.name,
            account_last4: (dev.bank?.accountNumber || '').slice(-4),
            type: 'developer_royalty_payout'
          },
          theme: {
            color: '#ec4899'
          },
          modal: {
            ondismiss: function () {
              setPayingDevId(null);
              fetchOverview();
            }
          },
          handler: function (response: any) {
            setFeedback({
              msg: `✅ Payment of ₹${dev.netPayable.toLocaleString()} transferred to ${dev.name}! Payment ID: ${response.razorpay_payment_id}`,
              type: 'success'
            });
            setPayingDevId(null);
            fetchOverview();
          }
        });

        rzp.open();
      } else {
        // Fallback navigation if Razorpay SDK hasn't loaded yet
        const redirectTarget = resData.razorpayPaymentLink || 
          `https://rzp.io/rzp/settle_${dev.developerId.slice(0, 8)}_${Date.now().toString().slice(-6)}`;
        window.location.href = redirectTarget;
      }

      fetchOverview();
    } catch (err: any) {
      setFeedback({ msg: `❌ ${err.message}`, type: 'error' });
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
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <style>{`
        /* Smooth scrolling container without visible scrollbar */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
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

          <div className="no-scrollbar" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '680px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
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
                      {(dev.isPaid || localPaidDevIds.has(dev.developerId)) ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700 }}>
                          <span>✅ Paid & Settled</span>
                        </div>
                      ) : (
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
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
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

        {/* Confirmation Modal for Direct Settlement */}
        {confirmPayoutModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '460px',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(236, 72, 153, 0.15)',
              border: '1px solid #fbcfe8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: '#dcfce7',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.35rem'
                }}>
                  💸
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                    Confirm Bank Transfer
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Direct NEFT / Razorpay X Payout
                  </span>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Recipient:</span>
                  <strong style={{ color: '#0f172a' }}>{confirmPayoutModal.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Bank & IFSC:</span>
                  <span style={{ color: '#0f172a' }}>{confirmPayoutModal.bank?.bankName || 'HDFC Bank'} ({confirmPayoutModal.bank?.ifsc || 'N/A'})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Account:</span>
                  <code style={{ color: '#0f172a' }}>{confirmPayoutModal.bank?.accountNumber || confirmPayoutModal.payoutRef}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{ color: '#64748b', fontWeight: 700 }}>Settlement Amount:</span>
                  <strong style={{ color: '#15803d', fontSize: '1.1rem' }}>₹{confirmPayoutModal.netPayable.toLocaleString()}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setConfirmPayoutModal(null)}
                  style={{ padding: '0.55rem 1.15rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeTransfer(confirmPayoutModal)}
                  style={{
                    padding: '0.55rem 1.35rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(21, 128, 61, 0.25)'
                  }}
                >
                  Confirm & Transfer →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Missing Bank Alert Custom Modal */}
        {noBankAlertModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '440px',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(236, 72, 153, 0.15)',
              border: '1px solid #fecaca'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem'
                }}>
                  ⚠️
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                    Bank Account Not Linked
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Settlement Blocked
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
                <strong>{noBankAlertModal}</strong> has not linked a verified Indian bank account or IFSC code in their Developer Console yet. Please request bank account submission before dispatching payouts.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setNoBankAlertModal(null)}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#ec4899',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
