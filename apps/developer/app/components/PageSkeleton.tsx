'use client';
import React from 'react';

export function PageSkeleton({
  title = 'Loading Workspace...',
  subtitle = 'Fetching real-time records from PostgreSQL database'
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div
      style={{
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        backgroundColor: '#090d16',
        color: '#f8fafc',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <style>{`
        @keyframes skeletonPulse {
          0% { opacity: 0.45; }
          50% { opacity: 0.85; }
          100% { opacity: 0.45; }
        }
        @keyframes shimmerGlow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .sk-pulse {
          animation: skeletonPulse 1.6s ease-in-out infinite;
          background: rgba(255, 255, 255, 0.06);
          position: relative;
          overflow: hidden;
        }
        .sk-pulse::after {
          content: '';
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
          animation: shimmerGlow 2s infinite;
        }
      `}</style>

      {/* Top Navbar Skeleton */}
      <header
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#0c1222',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="sk-pulse" style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div className="sk-pulse" style={{ width: '130px', height: '14px', borderRadius: '4px' }} />
            <div className="sk-pulse" style={{ width: '85px', height: '10px', borderRadius: '3px' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="sk-pulse" style={{ width: '110px', height: '32px', borderRadius: '8px' }} />
          <div className="sk-pulse" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
        </div>
      </header>

      {/* Body Content Skeleton */}
      <main style={{ padding: '2.5rem 2rem', maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {/* Header Hero Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <div className="sk-pulse" style={{ width: '22px', height: '22px', borderRadius: '6px' }} />
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                {title}
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8' }}>
              {subtitle}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="sk-pulse" style={{ width: '140px', height: '38px', borderRadius: '10px' }} />
            <div className="sk-pulse" style={{ width: '120px', height: '38px', borderRadius: '10px' }} />
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                backgroundColor: '#111827',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div className="sk-pulse" style={{ width: '90px', height: '12px', borderRadius: '4px' }} />
                <div className="sk-pulse" style={{ width: '24px', height: '24px', borderRadius: '6px' }} />
              </div>
              <div className="sk-pulse" style={{ width: '120px', height: '28px', borderRadius: '6px', marginBottom: '0.6rem' }} />
              <div className="sk-pulse" style={{ width: '160px', height: '10px', borderRadius: '3px' }} />
            </div>
          ))}
        </div>

        {/* Table / Grid Container Skeleton */}
        <div
          style={{
            backgroundColor: '#111827',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '1.75rem',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
            <div className="sk-pulse" style={{ width: '180px', height: '18px', borderRadius: '6px' }} />
            <div className="sk-pulse" style={{ width: '100px', height: '30px', borderRadius: '8px' }} />
          </div>

          {/* Skeleton Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3, 4, 5].map((row) => (
              <div
                key={row}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="sk-pulse" style={{ width: '42px', height: '42px', borderRadius: '10px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div className="sk-pulse" style={{ width: '150px', height: '14px', borderRadius: '4px' }} />
                    <div className="sk-pulse" style={{ width: '220px', height: '10px', borderRadius: '3px' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div className="sk-pulse" style={{ width: '70px', height: '22px', borderRadius: '999px' }} />
                  <div className="sk-pulse" style={{ width: '90px', height: '12px', borderRadius: '4px' }} />
                  <div className="sk-pulse" style={{ width: '80px', height: '32px', borderRadius: '8px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

