'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, STORE_URL } from '../config';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('owner@brewstreet.com');
  const [password, setPassword] = useState('password123');
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
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        padding: '2.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>BizBox</span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#3b82f6',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '2px 8px',
              borderRadius: '6px'
            }}>Console</span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem 0' }}>
            Business Owner Sign In
          </h1>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
            Access your BizBox box telemetry, installed apps &amp; licenses.
          </p>
        </div>

        {/* Demo Credentials Helper Pill */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
          marginBottom: '1.5rem',
          fontSize: '0.78rem',
          color: '#334155'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>🔑 Demo Owner Credentials:</span>
            <button
              type="button"
              onClick={handleAutoFill}
              style={{
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Autofill
            </button>
          </div>
          <div>Email: <strong style={{ color: '#0284c7' }}>owner@brewstreet.com</strong></div>
          <div>Password: <strong style={{ color: '#0284c7' }}>password123</strong></div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>
            Outlet: Brew Street Cafe (Pi 5 · BLR-001)
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.82rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. owner@brewstreet.com"
              style={{
                width: '100%',
                padding: '0.7rem 0.9rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                Password
              </label>
              <span style={{ fontSize: '0.75rem', color: '#3b82f6', cursor: 'pointer' }}>Forgot password?</span>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.7rem 0.9rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem',
                color: '#0f172a',
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
              padding: '0.8rem',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
              transition: 'background-color 0.15s ease'
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Console →'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <a
            href={STORE_URL}
            style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}
          >
            ← Back to Public App Store
          </a>
        </div>
      </div>
    </div>
  );
}

