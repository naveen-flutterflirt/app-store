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
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* Top Header */}
      <header style={{
        height: '60px',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>BizBox</span>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            color: '#0284c7',
            backgroundColor: '#e0f2fe',
            border: '1px solid #bae6fd',
            padding: '2px 8px',
            borderRadius: '6px'
          }}>Partner Developer Onboarding</span>
        </div>
        <a href="/login" style={{ fontSize: '0.82rem', color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
          Already registered? Sign In →
        </a>
      </header>

      {/* Main Registration Card */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          padding: '2.5rem'
        }}>
          <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              fontSize: '1.4rem',
              marginBottom: '0.75rem'
            }}>
              🚀
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem 0' }}>
              Create Developer Account
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Register your organization to publish apps, test on edge sandboxes, and earn 80% revenue share.
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Company / Organization *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. KitchenMetrics"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Website / Portfolio
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Work Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="dev@kitchenmetrics.com"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Password (min 6 chars) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              padding: '0.75rem',
              fontSize: '0.72rem',
              color: '#475569',
              lineHeight: 1.4
            }}>
              🔒 <strong>Developer Agreement:</strong> By continuing, you agree to BizBox Developer Guidelines, automated sandboxed security scanning, and an 80% net revenue share model.
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.25rem',
                padding: '0.75rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
              }}
            >
              {loading ? 'Creating Developer Workspace...' : 'Create Account & Start Building →'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Already have a registered account? </span>
            <a href="/login" style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}>
              Sign in here
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

