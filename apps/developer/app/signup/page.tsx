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
      backgroundColor: '#faf5f8',
      display: 'flex',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#0f172a'
    }}>
      <style>{`
        .signup-btn-pink {
          background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
          box-shadow: 0 4px 14px rgba(236, 72, 153, 0.35);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .signup-btn-pink:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(236, 72, 153, 0.45);
        }
      `}</style>

      {/* Left Visual Branding Panel - Pink & White Luxury */}
      <div style={{
        flex: '1 1 45%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '3.5rem',
        background: 'linear-gradient(145deg, #ffffff 0%, #fdf2f8 60%, #fce7f3 100%)',
        borderRight: '1px solid #fbcfe8',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(244, 114, 182, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Brand */}
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
                Partner Program
              </span>
            </div>
          </a>
        </div>

        {/* Narrative */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px', margin: '2.5rem 0' }}>
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
            <span>💼</span> Verified Developer Onboarding
          </div>
          <h1 style={{
            fontSize: '2.4rem',
            fontWeight: 900,
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            color: '#0f172a',
            margin: '0 0 1.25rem 0'
          }}>
            Join the Next-Gen POS App Marketplace
          </h1>
          <p style={{
            fontSize: '1rem',
            lineHeight: 1.65,
            color: '#475569',
            margin: '0 0 2rem 0'
          }}>
            Register your software development company or individual builder account. Submit packages, run automated CI checks, test with release tracks, and receive automated 80% monthly revenue payouts.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#334155', fontSize: '0.88rem', fontWeight: 700 }}>
              <span style={{ color: '#ec4899', fontSize: '1.1rem' }}>✓</span> Instant Developer Sandbox Access
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#334155', fontSize: '0.88rem', fontWeight: 700 }}>
              <span style={{ color: '#ec4899', fontSize: '1.1rem' }}>✓</span> 80/20 Monthly Revenue Split via Razorpay Route
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#334155', fontSize: '0.88rem', fontWeight: 700 }}>
              <span style={{ color: '#ec4899', fontSize: '1.1rem' }}>✓</span> Edge Container Hub for Raspberry Pi 5 POS Hardware
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ position: 'relative', zIndex: 1, fontSize: '0.78rem', color: '#94a3b8' }}>
          © {new Date().getFullYear()} BizBox POS Technologies • Enterprise Restaurant Suite
        </div>
      </div>

      {/* Right Registration Form */}
      <div style={{
        flex: '1 1 55%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem 2rem',
        backgroundColor: '#ffffff',
        overflowY: 'auto'
      }}>
        <div style={{ width: '100%', maxWidth: '460px' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.45rem 0', letterSpacing: '-0.02em' }}>
              Create Developer Account
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
              Start publishing your POS applications to thousands of restaurants.
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

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.45rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid #fbcfe8',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(236, 72, 153, 0.15)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#fbcfe8'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.45rem' }}>
                  Company / Organization *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. PulseTech Labs"
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid #fbcfe8',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(236, 72, 153, 0.15)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#fbcfe8'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.45rem' }}>
                Work Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="alex@pulsetech.io"
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #fbcfe8',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(236, 72, 153, 0.15)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#fbcfe8'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155' }}>
                  Password *
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
                placeholder="Minimum 8 characters"
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #fbcfe8',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(236, 72, 153, 0.15)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#fbcfe8'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.45rem' }}>
                Company Website (Optional)
              </label>
              <input
                type="url"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://pulsetech.io"
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #fbcfe8',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(236, 72, 153, 0.15)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#fbcfe8'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="signup-btn-pink"
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
              {loading ? 'Creating Developer Workspace...' : 'Register Developer Organization →'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
            <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
              Already registered as a partner?{' '}
              <a href="/login" style={{ color: '#db2777', fontWeight: 800, textDecoration: 'none' }}>
                Sign In to Console →
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
