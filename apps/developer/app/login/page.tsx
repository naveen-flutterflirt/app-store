'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, STORE_URL } from '../config';

export default function DeveloperLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('dev@kitchenmetrics.com');
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
      backgroundColor: '#064e3b',
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
        color: '#0f172a'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>BizBox</span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#10b981',
              backgroundColor: '#ecfdf5',
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid #a7f3d0'
            }}>Developer</span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem 0' }}>
            Partner Developer Sign In
          </h1>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
            Publish versions, trigger CI pipelines &amp; track 80% RevShare payouts.
          </p>
        </div>

        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
          marginBottom: '1.5rem',
          fontSize: '0.78rem',
          color: '#334155'
        }}>
          <div style={{ fontWeight: 700, color: '#059669', marginBottom: '0.35rem' }}>💻 Partner Developer:</div>
          <div>Email: <strong style={{ color: '#0284c7' }}>dev@kitchenmetrics.com</strong></div>
          <div>Password: <strong style={{ color: '#0284c7' }}>password123</strong></div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>
            Partner: KitchenMetrics (FoodCost Pro)
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
            marginBottom: '1.25rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
              Developer Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem 0.9rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem 0.9rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem',
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
              backgroundColor: '#059669',
              color: '#ffffff',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Validating partner account...' : 'Sign In to Dev Console →'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <a
            href={STORE_URL}
            style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none' }}
          >
            ← Public Store
          </a>
        </div>
      </div>
    </div>
  );
}

