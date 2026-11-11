'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, STORE_URL } from '../config';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@flutterflirt.com');
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

      if (data.user.role !== 'admin') {
        throw new Error('Access denied. This portal is restricted to FlutterFlirt Admin & Reviewers.');
      }

      localStorage.setItem('bizbox_token', data.token);
      localStorage.setItem('bizbox_user', JSON.stringify(data.user));
      localStorage.setItem('bizbox_tenant', JSON.stringify(data.tenant));

      router.push('/review-queue');
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
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '20px',
        padding: '2.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        color: '#ffffff'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff' }}>BizBox</span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#ec4899',
              backgroundColor: '#831843',
              padding: '2px 8px',
              borderRadius: '6px'
            }}>Admin</span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.4rem 0' }}>
            FlutterFlirt Internal Portal
          </h1>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
            Protected Review Queue, Cosign Publishing &amp; Store Metrics.
          </p>
        </div>

        <div style={{
          backgroundColor: '#0f172a',
          border: '1px dashed #475569',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
          marginBottom: '1.5rem',
          fontSize: '0.78rem',
          color: '#cbd5e1'
        }}>
          <div style={{ fontWeight: 700, color: '#f43f5e', marginBottom: '0.35rem' }}>🔒 Staff Credentials:</div>
          <div>Email: <strong style={{ color: '#38bdf8' }}>admin@flutterflirt.com</strong></div>
          <div>Password: <strong style={{ color: '#38bdf8' }}>password123</strong></div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>
            Role: Store Reviewer &amp; Admin Panel
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#450a0a',
            border: '1px solid #991b1b',
            color: '#fca5a5',
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
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Admin Email
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
                border: '1px solid #475569',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
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
                border: '1px solid #475569',
                backgroundColor: '#0f172a',
                color: '#ffffff',
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
              backgroundColor: '#ec4899',
              color: '#ffffff',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Verifying permissions...' : 'Sign In as Admin →'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #334155', textAlign: 'center' }}>
          <a
            href={STORE_URL}
            style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'none' }}
          >
            ← Public Store
          </a>
        </div>
      </div>
    </div>
  );
}

