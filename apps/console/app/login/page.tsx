'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, STORE_URL } from '../config';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('owner@brewstreet.com');
  const [password, setPassword] = useState('password123');
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
        throw new Error(data.message || 'Login failed. Please check credentials.');
      }

      if (data.user.role !== 'owner' && data.user.role !== 'admin') {
        throw new Error('Access denied. This portal is for Business Owners only.');
      }

      // Store business owner session in localStorage
      localStorage.setItem('bizbox_user', JSON.stringify(data.user));
      localStorage.setItem('bizbox_tenant', JSON.stringify(data.tenant));
      localStorage.setItem('bizbox_token', data.token);

      // Redirect to My Apps Dashboard
      router.push('/apps');
    } catch (err: any) {
      setError(err.message || 'Network error logging in');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = () => {
    setEmail('owner@brewstreet.com');
    setPassword('password123');
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* Top Navigation Strip */}
      <header style={{
        height: '60px',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem'
      }}>
        <a href={STORE_URL} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>BizBox</span>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            color: '#0284c7',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            padding: '2px 8px',
            borderRadius: '6px'
          }}>Merchant Console</span>
        </a>
        <a href={STORE_URL} style={{ fontSize: '0.82rem', color: '#64748b', textDecoration: 'none', fontWeight: 600 }}>
          ← Back to Storefront
        </a>
      </header>

      {/* Main Login Canvas */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.5rem',
        background: 'radial-gradient(ellipse at top, #f0f9ff 0%, #f8fafc 70%)'
      }}>
        <div style={{
          maxWidth: '460px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '2.75rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 40px -15px rgba(2, 132, 199, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          {/* Brand & Persona Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              color: '#0284c7',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              marginBottom: '1rem',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.12)'
            }}>
              🏪
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>
              Business Owner Sign In
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
              Manage your Edge hardware, installed POS apps &amp; Razorpay subscriptions.
            </p>
          </div>

          {/* Quick Demo Credentials Autofill Banner */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '14px',
            padding: '1rem',
            marginBottom: '1.75rem',
            fontSize: '0.8rem',
            color: '#334155'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>🔑</span> Verified Merchant Account
              </span>
              <button
                type="button"
                onClick={handleAutoFill}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '3px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(2, 132, 199, 0.25)'
                }}
              >
                Autofill
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div>Email: <strong style={{ color: '#0284c7' }}>owner@brewstreet.com</strong></div>
              <div>Password: <strong style={{ color: '#0284c7' }}>password123</strong></div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.35rem' }}>
                Store: <strong>Brew Street Cafe</strong> • Hardware: <strong>BizBox Edge (Pi 5)</strong>
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              fontSize: '0.82rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.45rem' }}>
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@yourbusiness.com"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease'
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.15s ease'
              }}
            >
              {loading ? (
                <>Verifying Merchant Node...</>
              ) : (
                <>Sign In to Merchant Console →</>
              )}
            </button>
          </form>

          {/* Footer Assistance */}
          <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Want to publish apps instead?{' '}
              <a href="https://app-store-ubpt.vercel.app/login" style={{ color: '#0284c7', fontWeight: 600, textDecoration: 'none' }}>
                Developer Portal →
              </a>
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '1.25rem 2rem',
        textAlign: 'center',
        fontSize: '0.78rem',
        color: '#94a3b8',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0'
      }}>
        BizBox App Store Platform • FlutterFlirt Private Limited • Built for Raspberry Pi 5 POS Hardware
      </footer>
    </div>
  );
}
