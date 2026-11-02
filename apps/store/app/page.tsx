'use client';
import React, { useState, useEffect } from 'react';

interface StoreApp {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  icon_url: string | null;
  rating_avg: string;
  rating_count: number;
  install_count: number;
  is_featured: boolean;
  is_core: boolean;
  developer: string;
  is_verified: boolean;
  latest_version: string;
  price_from: string | null;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  'sales': { bg: '#e0e7ff', text: '#4338ca', icon: 'POS' },
  'kitchen': { bg: '#cffafe', text: '#0e7490', icon: 'KDS' },
  'inventory': { bg: '#dcfce7', text: '#15803d', icon: 'INV' },
  'customers': { bg: '#f3e8ff', text: '#7e22ce', icon: 'CRM' },
  'finance': { bg: '#fef3c7', text: '#b45309', icon: 'GST' },
  'people': { bg: '#fee2e2', text: '#b91c1c', icon: 'HR' },
  'devices': { bg: '#e0f2fe', text: '#0369a1', icon: 'DEV' },
  'analytics': { bg: '#fae8ff', text: '#a21caf', icon: 'BI' },
  'marketing': { bg: '#fce7f3', text: '#be185d', icon: 'WA' },
  'industry': { bg: '#f1f5f9', text: '#334155', icon: 'IND' },
  'online': { bg: '#ffedd5', text: '#c2410c', icon: 'QR' },
  'ai': { bg: '#ede9fe', text: '#6d28d9', icon: 'AI' }
};

export default function StoreHomePage() {
  const [apps, setApps] = useState<StoreApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('http://localhost:4000/v1/store/apps')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setApps(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load apps:', err);
        setLoading(false);
      });
  }, []);

  const categories = [
    { key: 'all', label: 'All Categories' },
    { key: 'sales', label: 'Sales & POS' },
    { key: 'kitchen', label: 'Kitchen & Ops' },
    { key: 'inventory', label: 'Inventory & Stock' },
    { key: 'finance', label: 'GST & Finance' },
    { key: 'marketing', label: 'WhatsApp & Marketing' },
    { key: 'customers', label: 'CRM & Loyalty' },
    { key: 'devices', label: 'Hardware & Devices' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'ai', label: 'AI & Automation' }
  ];

  const filteredApps = apps.filter(app => {
    const matchesCat = selectedCategory === 'all' || app.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const featuredApps = apps.filter(a => a.is_featured).slice(0, 3);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', color: '#0f172a', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 800px 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }
        .nav-links-desktop {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .nav-mobile-toggle {
          display: none;
        }
        @media (max-width: 860px) {
          .nav-links-desktop {
            display: none !important;
          }
          .nav-mobile-toggle {
            display: flex !important;
          }
        }
        .hero-banner {
          padding: 3rem 3rem 2.75rem;
        }
        .hero-title {
          font-size: 2.4rem;
        }
        .main-padding {
          padding: 2rem 2.5rem;
        }
        @media (max-width: 640px) {
          .hero-banner {
            padding: 1.75rem 1.25rem !important;
          }
          .hero-title {
            font-size: 1.75rem !important;
          }
          .main-padding {
            padding: 1.25rem 1rem !important;
          }
          .featured-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Light Theme Navbar */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 1.5rem',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <a href="http://localhost:3000" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>BizBox</span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              color: '#ec4899',
              backgroundColor: '#fdf2f8',
              border: '1px solid #fbcfe8',
              padding: '1px 6px',
              borderRadius: '4px'
            }}>Apps</span>
          </a>

          {/* Desktop Nav */}
          <nav className="nav-links-desktop">
            <a href="http://localhost:3000" style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none' }}>Store</a>
            <a href="http://localhost:3000/services" style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Services Hub</a>
            <a href="http://localhost:3001/apps" style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>My Apps</a>
            <a href="http://localhost:3002" style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Developer</a>
            <a href="http://localhost:3002" style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Publish</a>
            <div style={{ height: '16px', width: '1px', backgroundColor: '#e2e8f0', margin: '0 0.25rem' }} />
            <a href="http://localhost:3003/review-queue" style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              Review queue
              <span style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: '999px' }}>1</span>
            </a>
            <a href="http://localhost:3003/dashboard" style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Dashboard</a>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.3rem 0.65rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px'
          }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#0ea5e9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700 }}>B</div>
            <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>Brew Street Cafe</div>
              <div style={{ fontSize: '0.62rem', color: '#64748b' }}>Business owner</div>
            </div>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            className="nav-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              padding: '0.35rem 0.6rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.8rem',
              color: '#0f172a',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#ffffff',
          borderBottom: '2px solid #e2e8f0',
          padding: '1rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          zIndex: 99
        }}>
          <a href="http://localhost:3000" style={{ padding: '0.5rem', color: '#0f172a', fontWeight: 700, textDecoration: 'none', borderBottom: '1px solid #f1f5f9' }}>Storefront Home</a>
          <a href="http://localhost:3000/services" style={{ padding: '0.5rem', color: '#475569', textDecoration: 'none', borderBottom: '1px solid #f1f5f9' }}>Services Hub</a>
          <a href="http://localhost:3001/apps" style={{ padding: '0.5rem', color: '#475569', textDecoration: 'none', borderBottom: '1px solid #f1f5f9' }}>Merchant Console (My Apps)</a>
          <a href="http://localhost:3002" style={{ padding: '0.5rem', color: '#475569', textDecoration: 'none', borderBottom: '1px solid #f1f5f9' }}>Developer Console & Publish</a>
          <a href="http://localhost:3003/review-queue" style={{ padding: '0.5rem', color: '#475569', textDecoration: 'none', borderBottom: '1px solid #f1f5f9' }}>Admin Review Queue (1)</a>
          <a href="http://localhost:3003/dashboard" style={{ padding: '0.5rem', color: '#475569', textDecoration: 'none' }}>Admin Metrics Dashboard</a>
        </div>
      )}

      {/* Main Container */}
      <main className="main-padding" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Hero Section */}
        <section className="hero-banner" style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          borderRadius: '20px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '2.5rem',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.2)'
        }}>
          <div style={{
            position: 'absolute',
            right: '-40px',
            bottom: '-60px',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #ec4899 0%, #db2777 100%)',
            opacity: 0.9,
            pointerEvents: 'none'
          }} />
          <h1 className="hero-title" style={{ fontWeight: 800, margin: '0 0 0.6rem 0', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Everything your business runs on.
          </h1>
          <p style={{ color: '#c7d2fe', fontSize: '0.95rem', margin: '0 0 1.75rem 0', maxWidth: '580px', lineHeight: 1.5 }}>
            22 apps for billing, kitchen, stock, customers, GST, staff and devices — installs in one click on your BizBox.
          </p>
          <div style={{ position: 'relative', width: '480px', maxWidth: '100%' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps — e.g. Kitchen, GST, WhatsApp, Inventory"
              style={{
                width: '100%',
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontSize: '0.9rem',
                outline: 'none',
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </section>

        {/* Featured Section */}
        {selectedCategory === 'all' && searchQuery === '' && (
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a' }}>Featured</h2>
            <div className="featured-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {(featuredApps.length > 0 ? featuredApps : apps.slice(0, 3)).map((app) => {
                const conf = CATEGORY_COLORS[app.category.toLowerCase()] || { bg: '#e0e7ff', text: '#4338ca', icon: 'APP' };
                return (
                  <a
                    key={app.id}
                    href={`/apps/${app.slug}`}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '0.75rem' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '10px',
                          backgroundColor: conf.bg,
                          color: conf.text,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          flexShrink: 0
                        }}>
                          {conf.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.name}</h3>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>by {app.developer}</div>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.4 }}>{app.tagline}</p>
                    </div>
                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                        {app.price_from ? (Number(app.price_from) === 0 ? 'Free' : `₹${Number(app.price_from).toFixed(0)}/mo`) : 'Free'}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0284c7' }}>View details →</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Categories Pills - Responsive Scrollable Row */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            {categories.map((c) => {
              const active = selectedCategory === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setSelectedCategory(c.key)}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '999px',
                    border: active ? '1px solid #0f172a' : '1px solid #e2e8f0',
                    backgroundColor: active ? '#0f172a' : '#ffffff',
                    color: active ? '#ffffff' : '#475569',
                    fontSize: '0.8rem',
                    fontWeight: active ? 600 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* All Apps Grid */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              All apps <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '0.9rem' }}>({filteredApps.length})</span>
            </h2>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.15rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.8rem' }}>
                    <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ width: '65%', height: '14px', marginBottom: '0.35rem' }} />
                      <div className="skeleton" style={{ width: '40%', height: '10px' }} />
                    </div>
                  </div>
                  <div className="skeleton" style={{ width: '100%', height: '12px', marginBottom: '0.4rem' }} />
                  <div className="skeleton" style={{ width: '80%', height: '12px', marginBottom: '1rem' }} />
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton" style={{ width: '30%', height: '12px' }} />
                    <div className="skeleton" style={{ width: '25%', height: '12px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {filteredApps.map((app) => {
                const conf = CATEGORY_COLORS[app.category.toLowerCase()] || { bg: '#e0e7ff', text: '#4338ca', icon: 'APP' };
                const isFree = !app.price_from || Number(app.price_from) === 0;
                return (
                  <a
                    key={app.id}
                    href={`/apps/${app.slug}`}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1.15rem',
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.6rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          backgroundColor: conf.bg,
                          color: conf.text,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          flexShrink: 0
                        }}>
                          {conf.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {app.name}
                          </h3>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>by {app.developer}</div>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.4, height: '2.8rem', overflow: 'hidden' }}>
                        {app.tagline}
                      </p>
                    </div>

                    <div style={{ marginTop: '1rem', paddingTop: '0.65rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                        {isFree ? 'Free' : `₹${Number(app.price_from).toFixed(0)}/mo`}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <span style={{ color: '#eab308' }}>★</span> {Number(app.rating_avg) > 0 ? Number(app.rating_avg).toFixed(1) : '5.0'}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
