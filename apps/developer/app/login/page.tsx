'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, STORE_URL } from '../config';

export default function DeveloperLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (data.user.role !== 'developer' && data.user.role !== 'admin') {
        throw new Error('Access denied. This portal is restricted to Verified Partner Developers.');
      }

      localStorage.setItem('bizbox_token', data.token);
      localStorage.setItem('bizbox_user', JSON.stringify(data.user));
      localStorage.setItem('bizbox_tenant', JSON.stringify(data.tenant));

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#faf5f8',
      display: 'flex',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#0f172a'
    }}>
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .login-btn-pink {
          background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
          box-shadow: 0 4px 14px rgba(236, 72, 153, 0.35);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .login-btn-pink:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(236, 72, 153, 0.45);
        }
      `}</style>

      {/* Left Visual Branding Panel - Pink & White Luxury */}
      <div style={{
        flex: '1 1 50%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '3.5rem',
        background: 'linear-gradient(145deg, #ffffff 0%, #fdf2f8 60%, #fce7f3 100%)',
        borderRight: '1px solid #fbcfe8',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative glow circles */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '550px',
          height: '550px',
          background: 'radial-gradient(circle, rgba(244, 114, 182, 0.22) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '450px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(251, 207, 232, 0.5) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Brand Header */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <a href={STORE_URL} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.3rem',
              color: '#ffffff',
              boxShadow: '0 6px 16px rgba(236, 72, 153, 0.35)'
            }}>
              B
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem' }}>
              <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>BizBox</span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#db2777',
                backgroundColor: '#fce7f3',
                padding: '3px 9px',
                borderRadius: '6px',
                border: '1px solid #fbcfe8',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                Developer Console
              </span>
            </div>
          </a>
        </div>

        {/* Hero Narrative */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '520px', margin: '3rem 0' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.95rem',
            borderRadius: '999px',
            backgroundColor: '#ffffff',
            border: '1px solid #fbcfe8',
            color: '#db2777',
            fontSize: '0.8rem',
            fontWeight: 800,
            marginBottom: '1.75rem',
            boxShadow: '0 2px 8px rgba(236, 72, 153, 0.08)'
          }}>
            <span>✨</span> Built for Enterprise Restaurant Platforms
          </div>
          <h1 style={{
            fontSize: '2.6rem',
            fontWeight: 900,
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            color: '#0f172a',
            margin: '0 0 1.25rem 0'
          }}>
            Publish POS & Kitchen Extensions to 5,000+ Outlets
          </h1>
          <p style={{
            fontSize: '1.02rem',
            lineHeight: 1.65,
            color: '#475569',
            margin: '0 0 2rem 0'
          }}>
            Multi-track releases (Internal, Closed Beta, Production), automated manifest security checks, Cosign signing, and direct 80/20 monthly revenue payouts.
          </p>

          {/* Value Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div style={{
              padding: '1.15rem',
              borderRadius: '14px',
              backgroundColor: '#ffffff',
              border: '1px solid #fbcfe8',
              boxShadow: '0 4px 12px rgba(236, 72, 153, 0.06)'
            }}>
              <div style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>🔒</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>Cosign Signed</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Cryptographic bundle validation</div>
            </div>

            <div style={{
              padding: '1.15rem',
              borderRadius: '14px',
              backgroundColor: '#ffffff',
              border: '1px solid #fbcfe8',
              boxShadow: '0 4px 12px rgba(236, 72, 153, 0.06)'
            }}>
              <div style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>💳</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>80% Net Share</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Automated Razorpay Route NEFT</div>
            </div>

            <div style={{
              padding: '1.15rem',
              borderRadius: '14px',
              backgroundColor: '#ffffff',
              border: '1px solid #fbcfe8',
              boxShadow: '0 4px 12px rgba(236, 72, 153, 0.06)'
            }}>
              <div style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>⚡</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>Edge ARM64</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Raspberry Pi 5 local offline runtime</div>
            </div>

            <div style={{
              padding: '1.15rem',
              borderRadius: '14px',
              backgroundColor: '#ffffff',
              border: '1px solid #fbcfe8',
              boxShadow: '0 4px 12px rgba(236, 72, 153, 0.06)'
            }}>
              <div style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>🚀</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>Release Tracks</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Staged rollouts & canary testing</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8' }}>
          <div>© {new Date().getFullYear()} BizBox POS Technologies</div>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <a href={`${STORE_URL}/api-docs`} target="_blank" rel="noreferrer" style={{ color: '#db2777', textDecoration: 'none', fontWeight: 700 }}>API Docs ↗</a>
            <a href="https://flutterflirt.com" target="_blank" rel="noreferrer" style={{ color: '#64748b', textDecoration: 'none' }}>FlutterFlirt Ecosystem</a>
          </div>
        </div>
      </div>

      {/* Right Login Form Container */}
      <div style={{
        flex: '1 1 50%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem 2rem',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ marginBottom: '2.25rem' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
              Welcome back
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
              Enter your partner developer credentials to access your console.
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#be123c',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              fontSize: '0.84rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.45rem' }}>
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="dev@kitchenmetrics.com"
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #fbcfe8',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s, box-shadow 0.15s'
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(236, 72, 153, 0.15)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#fbcfe8'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', color: '#db2777', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #fbcfe8',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s, box-shadow 0.15s'
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(236, 72, 153, 0.15)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#fbcfe8'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-btn-pink"
              style={{
                marginTop: '0.5rem',
                padding: '0.9rem 1.25rem',
                borderRadius: '12px',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Developer Console →'}
            </button>
          </form>

          {/* Quick Demo Credentials Pill */}
          <div style={{
            marginTop: '1.75rem',
            padding: '1rem',
            borderRadius: '12px',
            backgroundColor: '#fdf2f8',
            border: '1px solid #fbcfe8',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#db2777' }}>DEMO PARTNER ACCOUNT</span>
              <button
                type="button"
                onClick={() => {
                  setEmail('dev@kitchenmetrics.com');
                  setPassword('password123');
                }}
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #fbcfe8',
                  color: '#db2777',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Auto-fill
              </button>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              <code>dev@kitchenmetrics.com</code> • <code>password123</code>
            </div>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
            <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
              New developer organization?{' '}
              <a href="/signup" style={{ color: '#db2777', fontWeight: 800, textDecoration: 'none' }}>
                Create Developer Account →
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
