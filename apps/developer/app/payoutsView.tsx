'use client';
import React, { useState, useEffect } from 'react';
import { API_URL } from './config';

interface EarningsData {
  developer: {
    id: string;
    name: string;
    email: string;
    revenueSharePct: number;
    payoutConfigured: boolean;
    payoutRef: string | null;
    gstin: string | null;
  };
  metrics: {
    grossMrr: number;
    developerShareMrr: number;
    tdsDeduction: number;
    nextEstimatedPayout: number;
    totalLifetimePaid: number;
    activePayingOutlets: number;
  };
  apps: Array<{
    id: string;
    name: string;
    package_id: string;
    status: string;
    active_installs: number;
    gross_mrr: string;
  }>;
  history: Array<{
    id: string;
    period_start: string;
    period_end: string;
    gross: string;
    platform_fee: string;
    tds: string;
    net: string;
    status: string;
    provider_ref: string;
  }>;
}

interface DeveloperPayoutsViewProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function DeveloperPayoutsView({ showToast }: DeveloperPayoutsViewProps) {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBankModal, setShowBankModal] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  // Bank Form State
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [gstin, setGstin] = useState('');

  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('bizbox_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const fetchEarnings = () => {
    setLoading(true);
    fetch(`${API_URL}/dev/earnings`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load earnings:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    try {
      const res = await fetch(`${API_URL}/dev/payout-settings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          accountHolder: accountHolder.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim().toUpperCase(),
          bankName: bankName.trim(),
          panNumber: panNumber.trim().toUpperCase(),
          gstin: gstin.trim().toUpperCase()
        })
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.message || 'Failed to save bank settings');

      showToast('Bank account and tax details registered securely!', 'success');
      setShowBankModal(false);
      fetchEarnings();
    } catch (err: any) {
      showToast(err.message || 'Error saving payout details', 'error');
    } finally {
      setSavingBank(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        Loading monetization and revenue ledger...
      </div>
    );
  }

  const metrics = data?.metrics || {
    grossMrr: 0,
    developerShareMrr: 0,
    tdsDeduction: 0,
    nextEstimatedPayout: 0,
    totalLifetimePaid: 0,
    activePayingOutlets: 0
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner: Monetization & Payout Cycle */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
        border: '1px solid #bbf7d0',
        borderRadius: '20px',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
        boxShadow: '0 10px 25px -5px rgba(22, 101, 52, 0.05)'
      }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem' }}>💰</span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Developer Revenue & Monthly Payouts
            </h2>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              backgroundColor: '#dcfce7',
              color: '#15803d',
              padding: '2px 8px',
              borderRadius: '999px'
            }}>80% REVSHARE</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
            Whenever restaurant merchants subscribe to your apps on BizBox POS, <strong>80% of net proceeds</strong> are automatically calculated. Payouts are transferred via <strong>Direct Bank NEFT / Razorpay Route</strong> on the 1st of every month with standard 10% Section 194J TDS compliance.
          </p>
        </div>

        <div>
          {data?.developer.payoutConfigured ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: '#ffffff',
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid #bbf7d0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>
                  ✓ Bank Verified
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                  Linked: <code>{data.developer.payoutRef}</code>
                </div>
              </div>
              <button
                onClick={() => setShowBankModal(true)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Update
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowBankModal(true)}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)'
              }}
            >
              + Link Bank Account for Payouts
            </button>
          )}
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.4rem' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Merchant Sales (Gross MRR)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            ₹{Number(metrics.grossMrr).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            {metrics.activePayingOutlets} Active Paying Outlets
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #fbcfe8', borderRadius: '16px', padding: '1.4rem', background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)' }}>
          <div style={{ fontSize: '0.72rem', color: '#be185d', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Your Share (80%)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            ₹{Number(metrics.developerShareMrr).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#9d174d', marginTop: '0.2rem', fontWeight: 600 }}>
            Platform Fee: 20%
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.4rem' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            TDS Withheld (10%)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            ₹{Number(metrics.tdsDeduction).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Form 16A Tax Credit Certificate
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '1.4rem', background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' }}>
          <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Next Net Bank Deposit
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d' }}>
            ₹{Number(metrics.nextEstimatedPayout).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.2rem', fontWeight: 700 }}>
            Scheduled 1st of Next Month
          </div>
        </div>
      </div>

      {/* App-wise Revenue Breakdown */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>
          Application Sales & Subscription Breakdown
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>App</th>
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Subscribers</th>
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Gross Sales</th>
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Your Net Share</th>
            </tr>
          </thead>
          <tbody>
            {(!data?.apps || data.apps.length === 0) ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  No published applications currently generating subscription revenue.
                </td>
              </tr>
            ) : (
              data.apps.map(app => {
                const gross = Number(app.gross_mrr || 0);
                const devShare = Math.round(gross * 0.8 * 0.9);
                return (
                  <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{app.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{app.package_id}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', backgroundColor: '#dcfce7', color: '#15803d' }}>
                        ● {app.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#0f172a', fontWeight: 600 }}>
                      {app.active_installs} outlets
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                      ₹{gross.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', fontWeight: 800, color: '#16a34a', textAlign: 'right' }}>
                      ₹{devShare.toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Payout History Ledger */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>
          Monthly Payout History & Tax Invoices
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Period</th>
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Gross Amount</th>
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Platform Fee</th>
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>TDS Deducted</th>
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Net Transferred</th>
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Reference</th>
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {(!data?.history || data.history.length === 0) ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  No historical payout records yet. Earnings will settle at the end of the billing cycle.
                </td>
              </tr>
            ) : (
              data.history.map(h => (
                <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                    {h.period_start} to {h.period_end}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#475569' }}>
                    ₹{Number(h.gross).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#64748b' }}>
                    -₹{Number(h.platform_fee).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#b91c1c' }}>
                    -₹{Number(h.tds).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', fontWeight: 800, color: '#15803d' }}>
                    ₹{Number(h.net).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b' }}>
                    {h.provider_ref || 'NEFT_DIRECT'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '999px', backgroundColor: '#dcfce7', color: '#15803d' }}>
                      ● {h.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Bank & Tax Settings */}
      {showBankModal && (
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
            maxWidth: '520px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Bank Account & Payout Setup
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                  Direct automated transfer settings for monthly software royalties.
                </p>
              </div>
              <button onClick={() => setShowBankModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBank} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  Account Holder Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={e => setAccountHolder(e.target.value)}
                  placeholder="e.g. Pulse Kitchen Technologies Pvt Ltd"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={ifscCode}
                    onChange={e => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="HDFC0001234"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  Bank Account Number *
                </label>
                <input
                  type="password"
                  required
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder="50100023456789"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    PAN Number (Tax TDS) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={panNumber}
                    onChange={e => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    GSTIN (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={e => setGstin(e.target.value.toUpperCase())}
                    placeholder="27ABCDE1234F1Z5"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ backgroundColor: '#f1f5f9', padding: '0.75rem', borderRadius: '8px', fontSize: '0.72rem', color: '#475569', lineHeight: 1.4 }}>
                🔒 <strong>PCI-DSS & RBI Compliance:</strong> Bank account details are tokenized for Razorpay Route escrow. Raw bank credentials are never stored in plaintext.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  style={{ padding: '0.55rem 1.15rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBank}
                  style={{
                    padding: '0.55rem 1.35rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: savingBank ? 'not-allowed' : 'pointer'
                  }}
                >
                  {savingBank ? 'Saving...' : 'Save & Verify Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
