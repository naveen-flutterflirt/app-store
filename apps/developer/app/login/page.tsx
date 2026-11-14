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
      backgroundColor: '#090d16',
      display: 'flex',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#f8fafc'
    }}>
      {/* Left Visual Branding Panel */}
      <div style={{
        flex: '1 1 50%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '3.5rem',
        background: 'radial-gradient(ellipse at top left, #1e1b4b 0%, #0f172a 50%, #090d16 100%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative glow circles */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Brand Header */}
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

        {/* Hero Narrative */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '520px', margin: '3rem 0' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '999px',
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            color: '#818cf8',
            fontSize: '0.78rem',
            fontWeight: 700,
            marginBottom: '1.5rem'
          }}>
            <span>✨</span> Built for Enterprise Restaurant Platforms
          </div>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            color: '#ffffff',
            margin: '0 0 1.25rem 0'
          }}>
            Publish POS & Kitchen Extensions to 5,000+ Outlets
          </h1>
          <p style={{
            fontSize: '1rem',
            lineHeight: 1.6,
            color: '#94a3b8',
            margin: '0 0 2rem 0'
          }}>
            Multi-track releases (Internal, Closed Beta, Production), automated manifest security checks, Cosign signing, and direct 80/20 monthly revenue payouts.
          </p>

          {/* Value Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div style={{
              padding: '1rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>🔒</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>Cosign Signed</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Ed25519 tamper-proof bundle provenance</div>
            </div>
            <div style={{
              padding: '1rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>💰</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>80% Revenue Share</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Direct automated bank payouts & TDS ledger</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ position: 'relative', zIndex: 1, fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '1.5rem' }}>
          <span>© 2026 BizBox App Store Inc.</span>
          <a href={STORE_URL} target="_blank" rel="noreferrer" style={{ color: '#818cf8', textDecoration: 'none' }}>Public Store ↗</a>
        </div>
      </div>

      {/* Right Form Panel */}
      <div style={{
        flex: '1 1 50%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem 2rem',
        backgroundColor: '#0c1222'
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#ffffff', letterSpacing: '-0.02em' }}>
              Welcome back
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>
              Sign in to manage your extensions, release tracks, and bank payouts.
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

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.45rem' }}>
                Developer Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@company.com"
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Quick Autofill Helper for convenience */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Demo: dev@kitchenmetrics.com</span>
              <button
                type="button"
                onClick={() => {
                  setEmail('dev@kitchenmetrics.com');
                  setPassword('password123');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a855f7',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Autofill Credentials
              </button>
            </div>

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
              {loading ? 'Authenticating...' : 'Sign In to Developer Console →'}
            </button>
          </form>

          <div style={{
            marginTop: '2.5rem',
            paddingTop: '1.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            fontSize: '0.88rem',
            color: '#94a3b8'
          }}>
            New developer building for restaurants?{' '}
            <a href="/signup" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>
              Create an account →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
