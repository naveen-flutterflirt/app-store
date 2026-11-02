'use client';

import React, { useState } from 'react';
import { API_URL, STORE_URL, CONSOLE_URL, DEV_URL, ADMIN_URL } from '../config';

interface Endpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  category: 'Catalog' | 'Billing & GST' | 'Publishing & CI' | 'Admin & Review' | 'Edge Nodes';
  summary: string;
  description: string;
  responsePreview: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/v1/store/apps',
    category: 'Catalog',
    summary: 'List All Catalog Apps',
    description: 'Returns all verified marketplace applications with pricing, ratings, category tags, and trial configuration.',
    responsePreview: `[
  {
    "id": "9c23d4f5-c494-4a86-9b2d-b1baa35ae1bf",
    "name": "Kitchen Display",
    "slug": "kds",
    "category": "kitchen",
    "price_from": "499.00",
    "rating_avg": "4.90",
    "is_verified": true
  }
]`
  },
  {
    method: 'GET',
    path: '/v1/store/apps/:slug',
    category: 'Catalog',
    summary: 'Get App Details by Slug',
    description: 'Fetches detailed specification, screenshots, available subscription tiers, and developer profile.',
    responsePreview: `{
  "name": "Inventory & Recipes",
  "slug": "inventory",
  "developer": "FlutterFlirt",
  "plans": [
    { "id": "p_inv_mo", "name": "Monthly Pro", "price": 799, "trialDays": 14 }
  ]
}`
  },
  {
    method: 'GET',
    path: '/v1/store/categories',
    category: 'Catalog',
    summary: 'Catalog Categories & Counts',
    description: 'Lists all available PostgreSQL app_category enum keys and counts of listed applications.',
    responsePreview: `[
  { "category": "sales", "count": 12 },
  { "category": "kitchen", "count": 8 },
  { "category": "inventory", "count": 14 }
]`
  },
  {
    method: 'GET',
    path: '/v1/billing/subscriptions',
    category: 'Billing & GST',
    summary: 'Subscription Preview & Tax Breakdown',
    description: 'Calculates 18% GST (SAC 997331: 9% CGST + 9% SGST), UPI AutoPay mandate details, and active status.',
    responsePreview: `{
  "subtotal": 1298.00,
  "hsnSacCode": "997331",
  "cgst": 116.82,
  "sgst": 116.82,
  "totalGst": 233.64,
  "grandTotal": 1531.64,
  "mandate": "UPI AutoPay"
}`
  },
  {
    method: 'POST',
    path: '/v1/dev/apps',
    category: 'Publishing & CI',
    summary: 'Create New Draft App Listing',
    description: 'Registers a new package ID under the developer account in draft state with category normalization.',
    responsePreview: `{
  "id": "app_982bca",
  "name": "QuickToken Kiosk",
  "package_id": "in.developer.quicktoken-kiosk",
  "status": "draft"
}`
  },
  {
    method: 'POST',
    path: '/v1/dev/apps/:id/versions',
    category: 'Publishing & CI',
    summary: 'Submit Version for 6-Stage CI Audit',
    description: 'Initiates automated checks: Manifest, Syft SBOM, Trivy CVEs, License, ARM64 build, and Ed25519 signing.',
    responsePreview: `{
  "versionId": "ver_712",
  "status": "in_review",
  "ciResult": { "passed": 6, "failed": 0 }
}`
  },
  {
    method: 'GET',
    path: '/v1/admin/review-queue',
    category: 'Admin & Review',
    summary: 'Review Queue Submissions',
    description: 'Audits pending submissions, sensitive OAuth scopes, and reviewer decision checklist items.',
    responsePreview: `[
  {
    "version_id": "ver_712",
    "app": "KitchenMetrics",
    "developer": "KitchenMetrics",
    "channel": "Production",
    "checks_failed": 0
  }
]`
  },
  {
    method: 'GET',
    path: '/health',
    category: 'Edge Nodes',
    summary: 'System & Database Health Check',
    description: 'Checks Neon PostgreSQL connection pool health, latency, and platform uptime.',
    responsePreview: `{
  "status": "ok",
  "platform": "BizBox App Store API Gateway",
  "version": "1.0.0",
  "dbConnected": true
}`
  }
];

export default function ApiDocsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeEndpoint, setActiveEndpoint] = useState<Endpoint>(ENDPOINTS[0]);
  const [copied, setCopied] = useState(false);

  const categories = ['All', 'Catalog', 'Billing & GST', 'Publishing & CI', 'Admin & Review', 'Edge Nodes'];

  const filteredEndpoints = selectedCategory === 'All'
    ? ENDPOINTS
    : ENDPOINTS.filter(e => e.category === selectedCategory);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0.75rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <a href={STORE_URL} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>BizBox</span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              color: '#06b6d4',
              backgroundColor: '#ecfeff',
              border: '1px solid #a5f3fc',
              padding: '1px 6px',
              borderRadius: '4px'
            }}>API Docs</span>
          </a>
          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            <a href={STORE_URL} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Store</a>
            <a href={`${STORE_URL}/services`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Services Hub</a>
            <a href={`${STORE_URL}/api-docs`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none' }}>API Reference</a>
            <a href={`${CONSOLE_URL}/apps`} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>My Apps</a>
            <a href={DEV_URL} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Developer</a>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a
            href={`${API_URL.replace('/v1', '')}/health`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              padding: '0.35rem 0.75rem',
              borderRadius: '999px',
              color: '#047857',
              fontSize: '0.75rem',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            Port 4000 Live
          </a>
        </div>
      </header>

      {/* Hero Banner */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        padding: '3rem 2rem',
        borderBottom: '1px solid #334155'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#06b6d420', border: '1px solid #06b6d450', padding: '0.25rem 0.75rem', borderRadius: '999px', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 600, marginBottom: '1rem' }}>
            ⚡ 51 Endpoints &bull; OpenAPI 3.0 &bull; Neon PostgreSQL 18.6
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
            BizBox API Gateway Reference
          </h1>
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#94a3b8', maxWidth: '720px', lineHeight: 1.6 }}>
            Explore and test the core backend microservice powering the App Storefront, POS terminal integrations, developer submissions, and automated GST billing.
          </p>
        </div>
      </section>

      {/* Main Content Workspace */}
      <main style={{ maxWidth: '1100px', margin: '2rem auto 4rem', padding: '0 1.5rem' }}>
        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: selectedCategory === cat ? '1px solid #0f172a' : '1px solid #e2e8f0',
                backgroundColor: selectedCategory === cat ? '#0f172a' : '#ffffff',
                color: selectedCategory === cat ? '#ffffff' : '#64748b',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 2-Column Documentation View */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.75rem', alignItems: 'start' }}>
          {/* Left: Endpoint List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredEndpoints.map((ep) => {
              const isSelected = activeEndpoint.path === ep.path && activeEndpoint.method === ep.method;
              const methodBg = ep.method === 'GET' ? '#eff6ff' : (ep.method === 'POST' ? '#ecfdf5' : '#fef3c7');
              const methodColor = ep.method === 'GET' ? '#2563eb' : (ep.method === 'POST' ? '#059669' : '#d97706');

              return (
                <div
                  key={ep.method + ep.path}
                  onClick={() => setActiveEndpoint(ep)}
                  style={{
                    backgroundColor: '#ffffff',
                    border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 10px 15px -3px rgba(2, 132, 199, 0.1)' : '0 1px 3px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        backgroundColor: methodBg,
                        color: methodColor,
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        {ep.method}
                      </span>
                      <code style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{ep.path}</code>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{ep.category}</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
                    {ep.summary}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                    {ep.description}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Live Interactive Inspector */}
          <div style={{
            position: 'sticky',
            top: '80px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#1e293b',
              borderBottom: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Request & Response</span>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.15rem' }}>
                  {activeEndpoint.method} {activeEndpoint.path}
                </div>
              </div>
              <a
                href={`${API_URL.replace('/v1', '')}${activeEndpoint.path.replace('/:slug', '/inventory').replace('/:id/versions', '/draft/versions').replace('/:id', '')}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                Send Request ↗
              </a>
            </div>

            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Example Response (200 OK)</span>
                <button
                  onClick={() => handleCopy(activeEndpoint.responsePreview)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copied ? '#4ade80' : '#38bdf8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {copied ? '✓ Copied' : 'Copy JSON'}
                </button>
              </div>
              <pre style={{
                margin: 0,
                padding: '1rem',
                backgroundColor: '#020617',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '0.75rem',
                fontFamily: 'Menlo, Monaco, Consolas, monospace',
                overflowX: 'auto',
                lineHeight: 1.6
              }}>
                {activeEndpoint.responsePreview}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

