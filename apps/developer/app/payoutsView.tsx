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
    bankDetails?: {
      accountHolder: string;
      bankName: string;
      accountNumber: string;
      accountNumberMasked: string;
      ifsc: string;
      pan: string | null;
      gstin: string | null;
    } | null;
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

  // Bank Form State
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [pan, setPan] = useState('');
  const [gstin, setGstin] = useState('');
  const [savingBank, setSavingBank] = useState(false);

  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('bizbox_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/dev/earnings`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.developer?.bankDetails) {
          setAccountHolder(json.developer.bankDetails.accountHolder || '');
          setBankName(json.developer.bankDetails.bankName || '');
          setAccountNumber(json.developer.bankDetails.accountNumber || '');
          setIfsc(json.developer.bankDetails.ifsc || '');
          setPan(json.developer.bankDetails.pan || '');
          setGstin(json.developer.bankDetails.gstin || '');
        }
      }
    } catch (err: any) {
      console.error('Failed to load earnings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    try {
      const res = await fetch(`${API_URL}/dev/payouts/bank-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          accountHolder,
          bankName,
          accountNumber,
          ifsc,
          pan,
          gstin
        })
      });
      const resJson = await res.json();
      if (res.ok) {
        showToast('Bank account & statutory tax details verified and saved!', 'success');
        setShowBankModal(false);
        fetchEarnings();
      } else {
        showToast(resJson.message || 'Failed to save bank account', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error saving bank details', 'error');
    } finally {
      setSavingBank(false);
    }
  };

  const m = data?.metrics || {
    grossMrr: 0,
    developerShareMrr: 0,
    tdsDeduction: 0,
    nextEstimatedPayout: 0,
    totalLifetimePaid: 0,
    activePayingOutlets: 0
  };

  const dev = data?.developer;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Pink & White Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 50%, #fce7f3 100%)',
        border: '1px solid #fbcfe8',
        borderRadius: '20px',
        padding: '2.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: '0 4px 20px -2px rgba(236, 72, 153, 0.08)'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '999px',
            backgroundColor: '#ffffff',
            border: '1px solid #fbcfe8',
            color: '#db2777',
            fontSize: '0.75rem',
            fontWeight: 800,
            marginBottom: '0.85rem',
            boxShadow: '0 2px 6px rgba(236, 72, 153, 0.08)'
          }}>
            <span>💳</span> 80% Developer Revenue Share Standard
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 900, margin: '0 0 0.5rem 0', color: '#0f172a', letterSpacing: '-0.02em' }}>
            Earnings, Royalties & Bank Settlement
          </h2>
          <p style={{ margin: 0, fontSize: '0.92rem', color: '#475569', lineHeight: 1.6 }}>
            Track software royalties across all your POS subscribers. Net earnings are disbursed directly into your linked Indian bank account via automated Razorpay Route NEFT on the 1st of every month.
          </p>
        </div>

        <button
          onClick={() => {
            if (dev?.bankDetails) {
              setAccountHolder(dev.bankDetails.accountHolder || '');
              setBankName(dev.bankDetails.bankName || '');
              setAccountNumber(dev.bankDetails.accountNumber || '');
              setIfsc(dev.bankDetails.ifsc || '');
              setPan(dev.bankDetails.pan || '');
              setGstin(dev.bankDetails.gstin || '');
            }
            setShowBankModal(true);
          }}
          style={{
            padding: '0.85rem 1.45rem',
            borderRadius: '12px',
            border: 'none',
            background: dev?.payoutConfigured
              ? '#ffffff'
              : 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
            color: dev?.payoutConfigured ? '#db2777' : '#ffffff',
            fontWeight: 800,
            fontSize: '0.92rem',
            cursor: 'pointer',
            borderStyle: dev?.payoutConfigured ? 'solid' : 'none',
            borderWidth: '1px',
            borderColor: '#fbcfe8',
            boxShadow: dev?.payoutConfigured
              ? '0 2px 8px rgba(236, 72, 153, 0.08)'
              : '0 4px 14px rgba(236, 72, 153, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>🏦</span>
          <span>{dev?.payoutConfigured ? 'Update Bank Details' : 'Configure Bank Account'}</span>
        </button>
      </div>

      {/* 4 Financial Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #fbcfe8',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 4px 16px -2px rgba(236, 72, 153, 0.06)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#db2777', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Next Est. Payout
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.35rem' }}>
            ₹{m.nextEstimatedPayout.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Net payable after 10% TDS
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #fbcfe8',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 4px 16px -2px rgba(236, 72, 153, 0.06)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#db2777', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Developer Share (80%)
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.35rem' }}>
            ₹{m.developerShareMrr.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Gross sales: ₹{m.grossMrr.toLocaleString()}
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #fbcfe8',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 4px 16px -2px rgba(236, 72, 153, 0.06)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#db2777', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            TDS Withheld (10%)
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.35rem' }}>
            ₹{m.tdsDeduction.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Section 194J Software Royalties
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #fbcfe8',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 4px 16px -2px rgba(236, 72, 153, 0.06)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#db2777', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Subscribed Outlets
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.35rem' }}>
            {m.activePayingOutlets}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Active verified POS terminals
          </div>
        </div>
      </div>

      {/* Bank Account Info Card */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #fbcfe8',
        borderRadius: '18px',
        padding: '1.75rem',
        boxShadow: '0 4px 20px -2px rgba(236, 72, 153, 0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: '0 0 0.25rem 0', color: '#0f172a' }}>
              Linked Bank Account & Tax Identifiers
            </h3>
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Used for monthly automated direct wire transfers
            </div>
          </div>

          <span style={{
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 800,
            backgroundColor: dev?.payoutConfigured ? '#dcfce7' : '#fef3c7',
            color: dev?.payoutConfigured ? '#15803d' : '#b45309',
            border: `1px solid ${dev?.payoutConfigured ? '#bbf7d0' : '#fde68a'}`
          }}>
            {dev?.payoutConfigured ? '✓ VERIFIED & LINKED' : '⚠️ ACTION REQUIRED'}
          </span>
        </div>

        {dev?.bankDetails ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            <div style={{ backgroundColor: '#fdf2f8', padding: '1rem', borderRadius: '12px', border: '1px solid #fbcfe8' }}>
              <div style={{ fontSize: '0.72rem', color: '#db2777', fontWeight: 800, textTransform: 'uppercase' }}>Account Holder</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{dev.bankDetails.accountHolder}</div>
            </div>

            <div style={{ backgroundColor: '#fdf2f8', padding: '1rem', borderRadius: '12px', border: '1px solid #fbcfe8' }}>
              <div style={{ fontSize: '0.72rem', color: '#db2777', fontWeight: 800, textTransform: 'uppercase' }}>Bank Name & Account</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {dev.bankDetails.bankName} • <code>{dev.bankDetails.accountNumberMasked}</code>
              </div>
            </div>

            <div style={{ backgroundColor: '#fdf2f8', padding: '1rem', borderRadius: '12px', border: '1px solid #fbcfe8' }}>
              <div style={{ fontSize: '0.72rem', color: '#db2777', fontWeight: 800, textTransform: 'uppercase' }}>IFSC & PAN</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {dev.bankDetails.ifsc} • {dev.bankDetails.pan || 'N/A'}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            No bank details added yet. Click &quot;Configure Bank Account&quot; to set up your payout transfer preferences.
          </div>
        )}
      </div>

      {/* Bank Account Modal */}
      {showBankModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #fbcfe8',
            borderRadius: '20px',
            maxWidth: '560px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 40px -10px rgba(236, 72, 153, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                  Bank Account & Payout Setup
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px' }}>
                  Direct automated transfer settings for monthly software royalties.
                </div>
              </div>
              <button
                onClick={() => setShowBankModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBank} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  Account Holder Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={e => setAccountHolder(e.target.value)}
                  placeholder="e.g. Pulse Kitchen Technologies Pvt Ltd"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid #fbcfe8',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #fbcfe8',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={ifsc}
                    onChange={e => setIfsc(e.target.value)}
                    placeholder="HDFC0001234"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #fbcfe8',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  Bank Account Number *
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder="50100023456789"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid #fbcfe8',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                    PAN Number (Tax TDS) *
                  </label>
                  <input
                    type="text"
                    required
                    value={pan}
                    onChange={e => setPan(e.target.value)}
                    placeholder="ABCDE1234F"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #fbcfe8',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                    GSTIN (Optional)
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={e => setGstin(e.target.value)}
                    placeholder="27ABCDE1234F1Z5"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #fbcfe8',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                backgroundColor: '#fdf2f8',
                border: '1px solid #fbcfe8',
                fontSize: '0.78rem',
                color: '#64748b'
              }}>
                🔒 <strong>PCI-DSS & RBI Compliance:</strong> Bank account details are tokenized for Razorpay Route escrow. Raw bank credentials are never stored in plaintext.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBank}
                  style={{
                    padding: '0.75rem 1.45rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: savingBank ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(236, 72, 153, 0.35)'
                  }}
                >
                  {savingBank ? 'Saving & Verifying...' : 'Save & Verify Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
