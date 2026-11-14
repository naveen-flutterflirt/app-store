'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, STORE_URL } from '../config';

export default function DeveloperSignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [website, setWebsite] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/auth/developer-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          companyName: companyName.trim(),
          email: email.trim(),
          password,
          website: website.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Developer registration failed');
      }

      localStorage.setItem('bizbox_token', data.token);
      localStorage.setItem('bizbox_user', JSON.stringify(data.user));
      if (data.developer) {
        localStorage.setItem('bizbox_developer', JSON.stringify(data.developer));
      }

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      display: 'flex',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#f8fafc'
    }}>
      {/* Left Visual Narrative Panel */}
      <div style={{
        flex: '1 1 45%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '3.5rem',
        background: 'radial-gradient(ellipse at top left, #1e1b4b 0%, #0f172a 50%, #090d16 100%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <a href={STORE_URL} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.2rem',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
            }}>
              B
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>BizBox</span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#a855f7',
                backgroundColor: 'rgba(168, 85, 247, 0.12)',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                Developer Console
              </span>
            </div>
          </a>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px', margin: '2rem 0' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '999px',
            backgroundColor: 'rgba(168, 85, 247, 0.12)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            color: '#c084fc',
            fontSize: '0.78rem',
            fontWeight: 700,
            marginBottom: '1.5rem'
          }}>
            <span>🚀</span> Instant Self-Service Partner Onboarding
          </div>
          <h1 style={{
            fontSize: '2.4rem',
            fontWeight: 800,
            lineHeight: 1.25,
            letterSpacing: '-0.03em',
            color: '#ffffff',
            margin: '0 0 1.25rem 0'
          }}>
            Monetize Your Software Inside Real-World Outlets
          </h1>
          <p style={{
            fontSize: '0.98rem',
            lineHeight: 1.6,
            color: '#94a3b8',
            margin: '0 0 2rem 0'
          }}>
            Deploy hybrid POS extensions, kitchen display widgets, and real-time inventory tools. Receive 80% recurring revshare with instant bank routing.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>✓</div>
              <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>Multi-Track Testing (Internal, Closed Beta, Storewide)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>✓</div>
              <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>Compliant Razorpay Route Direct Bank Escrow</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>✓</div>
              <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>Zero Platform Fees on Beta & Pilot Testing</span>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, fontSize: '0.8rem', color: '#64748b' }}>
          <span>© 2026 BizBox Developer Platform</span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div style={{
        flex: '1 1 55%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem 2.5rem',
        backgroundColor: '#0c1222',
        overflowY: 'auto'
      }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#ffffff', letterSpacing: '-0.02em' }}>
              Create Developer Account
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>
              Start packaging your plugins and distributing to restaurants.
            </p>
          </div>

          {error && (
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              fontSize: '0.84rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.45rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.45rem' }}>
                  Company / Studio *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Pulse Kitchen Labs"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.45rem' }}>
                Business Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@pulsekitchen.io"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.9rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1' }}>
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.45rem' }}>
                  Website / Portfolio
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://pulsekitchen.io"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <p style={{ margin: '0.35rem 0', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>
              By creating a developer account, you agree to the BizBox Developer Revenue Share Agreement (80% net developer payout) and security guidelines.
            </p>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                padding: '0.85rem 1.5rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                color: '#ffffff',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? 'Creating Developer Workspace...' : 'Create Account & Start Building →'}
            </button>
          </form>

          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            fontSize: '0.88rem',
            color: '#94a3b8'
          }}>
            Already have a developer account?{' '}
            <a href="/login" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>
              Sign in →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
