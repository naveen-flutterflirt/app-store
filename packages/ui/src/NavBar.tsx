'use client';
import React, { useState } from 'react';

interface NavBarProps {
  active?: 'store' | 'services' | 'myapps' | 'developer' | 'publish' | 'review' | 'dashboard';
  role?: 'business' | 'developer' | 'admin';
  businessName?: string;
  onPublishClick?: () => void;
}

export function NavBar({ active = 'store', businessName = 'Brew Street Cafe', onPublishClick }: NavBarProps) {
  const getTabStyle = (key: string) => {
    const isActive = active === key;
    return {
      color: isActive ? '#0f172a' : '#64748b',
      textDecoration: 'none',
      fontSize: '0.8rem',
      fontWeight: isActive ? 600 : 500,
      padding: '0.35rem 0.6rem',
      borderRadius: '6px',
      backgroundColor: isActive ? '#f1f5f9' : 'transparent',
      transition: 'all 0.15s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem'
    };
  };

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '0 2rem',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
    }}>
      {/* Left brand + tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <a href="http://localhost:3000" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>BizBox</span>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            color: '#ec4899',
            backgroundColor: '#fdf2f8',
            border: '1px solid #fbcfe8',
            padding: '1px 6px',
            borderRadius: '4px',
            letterSpacing: '0.05em'
          }}>Apps</span>
        </a>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <a href="http://localhost:3000" style={getTabStyle('store')}>Store</a>
          <a href="http://localhost:3000/services" style={getTabStyle('services')}>Services Hub</a>
          <a href="http://localhost:3001/apps" style={getTabStyle('myapps')}>My Apps</a>
          <a href="http://localhost:3002" style={getTabStyle('developer')}>Developer</a>
          <a 
            href="http://localhost:3002" 
            onClick={onPublishClick ? (e) => { e.preventDefault(); onPublishClick(); } : undefined}
            style={getTabStyle('publish')}
          >
            Publish
          </a>
          <div style={{ height: '16px', width: '1px', backgroundColor: '#e2e8f0', margin: '0 0.25rem' }} />
          <a href="http://localhost:3003/review-queue" style={getTabStyle('review')}>
            Review queue
            <span style={{
              backgroundColor: '#fef3c7',
              color: '#d97706',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '9999px',
              border: '1px solid #fde68a'
            }}>1</span>
          </a>
          <a href="http://localhost:3003/dashboard" style={getTabStyle('dashboard')}>Dashboard</a>
        </nav>
      </div>

      {/* Right User/Tenant Pill */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.35rem 0.75rem',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px'
      }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: '#0ea5e9',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 700
        }}>
          {businessName.charAt(0)}
        </div>
        <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{businessName}</div>
          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Business owner · ₹0.00</div>
        </div>
      </div>
    </header>
  );
}
