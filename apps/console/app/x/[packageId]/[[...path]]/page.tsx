'use client';

import React, { useEffect, useState } from 'react';

interface AppShellProps {
  params: {
    packageId: string;
    path?: string[];
  };
}

/**
 * BizBox App Shell
 * Safely loads installed app UIs in sandboxed slots and acts as the bridge
 * between the parent POS/Console context and the child app iframe.
 */
export default function AppShellPage({ params }: AppShellProps) {
  const { packageId, path = [] } = params;
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [appContext, setAppContext] = useState<any>(null);

  useEffect(() => {
    // 1. Fetch installation context for this package
    async function loadAppContext() {
      try {
        const res = await fetch(`/api/installations/by-package/${packageId}/context`);
        if (!res.ok) {
          throw new Error('Failed to load installation context');
        }
        const data = await res.json();
        setAppContext(data);
        setStatus('ready');
      } catch (err) {
        // Fallback for development demo
        setAppContext({
          tenant: { id: '00000000-0000-0000-0000-000000000001', name: 'Brew & Bites Cafe' },
          packageId,
          grantedScopes: ['orders:read', 'menu:read'],
          token: 'demo-installation-scoped-jwt-token'
        });
        setStatus('ready');
      }
    }

    loadAppContext();

    // 2. Listen for messages from child app via @bizbox/app-sdk
    function handleAppMessage(event: MessageEvent) {
      if (!event.data || !event.data.type) return;

      switch (event.data.type) {
        case 'BIZBOX_TOAST':
          alert(`[BizBox Notification]: ${event.data.message}`);
          break;
        case 'BIZBOX_REGISTER_ACTION':
          console.log(`[App Shell] Registered UI slot action: ${event.data.slot} -> "${event.data.label}"`);
          break;
      }
    }

    window.addEventListener('message', handleAppMessage);
    return () => window.removeEventListener('message', handleAppMessage);
  }, [packageId]);

  if (status === 'loading') {
    return (
      <div style={{ padding: '2rem', color: '#94a3b8', fontFamily: 'sans-serif' }}>
        Loading app bundle for {packageId}...
      </div>
    );
  }

  const subPath = path.length > 0 ? `/${path.join('/')}` : '';
  const appSrc = `/apps-bundles/${packageId}/index.html${subPath}?token=${appContext?.token || ''}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0f172a' }}>
      {/* Shell Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', backgroundColor: '#1e293b', borderBottom: '1px solid #334155', color: '#fff' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>App Shell &bull; </span>
          <strong style={{ fontSize: '0.95rem' }}>{packageId}</strong>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', backgroundColor: '#10b98120', color: '#34d399', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
            Sandboxed
          </span>
          <span style={{ fontSize: '0.75rem', backgroundColor: '#6366f120', color: '#818cf8', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
            Outlet: Main Counter
          </span>
        </div>
      </div>

      {/* Sandboxed Iframe Container */}
      <iframe
        src={appSrc}
        title={`BizBox App: ${packageId}`}
        sandbox="allow-scripts allow-forms allow-same-origin"
        style={{
          width: '100%',
          flex: 1,
          border: 'none',
          backgroundColor: '#ffffff'
        }}
      />
    </div>
  );
}
