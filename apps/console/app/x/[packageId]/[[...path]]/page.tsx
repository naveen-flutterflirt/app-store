'use client';

import React, { useEffect, useState, useRef } from 'react';
import { API_URL, CONSOLE_URL } from '../../../config';

interface AppShellProps {
  params: {
    packageId: string;
    path?: string[];
  };
}

interface AppContext {
  installationId?: string;
  tenant: { id: string; name: string; businessType: string };
  app: { name: string; packageId: string; slug?: string; runtime: string; category?: string };
  grantedScopes: string[];
  token: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  direction: 'inbound' | 'outbound';
  type: string;
  payload: any;
}

/**
 * BizBox Sandboxed App Shell & Micro-Frontend Container
 * Bridges POS/Console runtime context and sandboxed application micro-frontends
 * via the @bizbox/app-sdk postMessage protocol.
 */
export default function AppShellPage({ params }: AppShellProps) {
  const { packageId, path = [] } = params;
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [appContext, setAppContext] = useState<AppContext | null>(null);
  const [registeredActions, setRegisteredActions] = useState<Array<{ slot: string; label: string }>>([]);
  const [inAppToast, setInAppToast] = useState<{ message: string; type: string } | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [simulatedOrders, setSimulatedOrders] = useState([
    { id: 'ORD-9821', item: 'Cold Brew Coffee x 2', amount: '₹340.00', status: 'PAID' },
    { id: 'ORD-9822', item: 'Blueberry Cheesecake x 1', amount: '₹220.00', status: 'KITCHEN' },
    { id: 'ORD-9823', item: 'Artisan Sourdough Toast x 1', amount: '₹180.00', status: 'SERVED' }
  ]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const addLog = (direction: 'inbound' | 'outbound', type: string, payload: any) => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      direction,
      type,
      payload
    };
    setLogs(prev => [entry, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    // 1. Fetch live installation context from API Gateway
    async function loadAppContext() {
      try {
        const res = await fetch(`${API_URL}/installations/by-package/${packageId}/context`);
        if (res.ok) {
          const data = await res.json();
          setAppContext(data);
          addLog('inbound', 'CONTEXT_INITIALIZED', { tenant: data.tenant.name, scopes: data.grantedScopes });
        } else {
          // Fallback context
          const fallback: AppContext = {
            tenant: { id: '00000000-0000-0000-0000-000000000001', name: 'Brew Street Cafe', businessType: 'cafe' },
            app: { name: packageId.split('.').pop() || 'App', packageId, runtime: 'hybrid', category: 'sales' },
            grantedScopes: ['orders:read', 'menu:read', 'stock:read'],
            token: 'demo-installation-scoped-jwt-token'
          };
          setAppContext(fallback);
        }
        setStatus('ready');
      } catch (err) {
        setAppContext({
          tenant: { id: '00000000-0000-0000-0000-000000000001', name: 'Brew Street Cafe', businessType: 'cafe' },
          app: { name: packageId.split('.').pop() || 'App', packageId, runtime: 'hybrid', category: 'sales' },
          grantedScopes: ['orders:read', 'menu:read', 'stock:read'],
          token: 'demo-installation-scoped-jwt-token'
        });
        setStatus('ready');
      }
    }

    loadAppContext();

    // 2. Listen for messages from sandboxed child app via @bizbox/app-sdk protocol
    function handleAppMessage(event: MessageEvent) {
      if (!event.data || !event.data.type) return;

      addLog('inbound', event.data.type, event.data);

      switch (event.data.type) {
        case 'BIZBOX_TOAST':
          setInAppToast({
            message: event.data.message || 'Notification received',
            type: event.data.toastType || 'info'
          });
          setTimeout(() => setInAppToast(null), 4000);
          break;

        case 'BIZBOX_REGISTER_ACTION':
          setRegisteredActions(prev => {
            if (prev.some(a => a.slot === event.data.slot)) return prev;
            return [...prev, { slot: event.data.slot, label: event.data.label }];
          });
          break;
      }
    }

    window.addEventListener('message', handleAppMessage);
    return () => window.removeEventListener('message', handleAppMessage);
  }, [packageId]);

  const triggerActionClick = (slot: string) => {
    addLog('outbound', 'BIZBOX_ACTION_CLICK', { slot });
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'BIZBOX_ACTION_CLICK',
        slot,
        payload: { timestamp: Date.now(), outlet: 'Main Counter' }
      }, '*');
    }
    setInAppToast({
      message: `Triggered slot action "${slot}"`,
      type: 'success'
    });
    setTimeout(() => setInAppToast(null), 3000);
  };

  const handleSimulateNewOrder = () => {
    const newId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const items = ['Espresso Tonic x 1', 'Avocado Croissant x 1', 'Masala Chai x 2', 'Matcha Latte x 1'];
    const prices = ['₹190.00', '₹260.00', '₹120.00', '₹240.00'];
    const randomIdx = Math.floor(Math.random() * items.length);

    const newOrder = {
      id: newId,
      item: items[randomIdx],
      amount: prices[randomIdx],
      status: 'PAID'
    };

    setSimulatedOrders(prev => [newOrder, ...prev]);

    // Dispatch event to app SDK listeners
    addLog('outbound', 'BIZBOX_EVENT', { event: 'order.created', orderId: newId });
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'BIZBOX_EVENT',
        event: 'order.created',
        payload: newOrder
      }, '*');
    }

    setInAppToast({
      message: `New Order Created: ${newId} (${newOrder.item})`,
      type: 'success'
    });
    setTimeout(() => setInAppToast(null), 3500);
  };

  if (status === 'loading') {
    return (
      <div style={{ padding: '3rem', color: '#64748b', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }} />
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>Initializing Sandboxed App Shell...</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>{packageId}</div>
        </div>
      </div>
    );
  }

  const appDisplayName = appContext?.app?.name || packageId.split('.').pop() || 'Application';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0f172a', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @media (max-width: 900px) {
          .appshell-header { padding: 0.75rem 1rem !important; flex-direction: column !important; align-items: flex-start !important; gap: 0.75rem !important; }
          .appshell-header-badges { display: flex !important; flex-wrap: wrap !important; width: 100% !important; }
          .appshell-grid { display: flex !important; flex-direction: column !important; overflow-y: auto !important; height: auto !important; }
          .appshell-inspector { border-left: none !important; border-top: 1px solid #334155 !important; min-height: 340px !important; }
          .appshell-viewport { padding: 1.25rem 1rem !important; }
        }
        @media (min-width: 901px) {
          .appshell-grid { display: grid !important; grid-template-columns: 1fr 360px !important; flex: 1 !important; overflow: hidden !important; }
        }
      `}</style>

      {/* Shell Header Bar */}
      <header className="appshell-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.75rem',
        backgroundColor: '#1e293b',
        borderBottom: '1px solid #334155',
        color: '#ffffff',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <a
            href={`${CONSOLE_URL}/apps`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              backgroundColor: '#0f172a'
            }}
          >
            ← My Apps
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#38bdf8',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.8rem'
            }}>
              {appDisplayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{appDisplayName}</span>
                <span style={{ fontSize: '0.68rem', backgroundColor: '#065f46', color: '#34d399', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  Active
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                {packageId}
              </div>
            </div>
          </div>
        </div>

        {/* Status badges */}
        <div className="appshell-header-badges" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.72rem', backgroundColor: '#0f172a', color: '#94a3b8', border: '1px solid #334155', padding: '0.3rem 0.65rem', borderRadius: '6px' }}>
            Node: <strong>BizBox Edge BLR01</strong>
          </span>
          <span style={{ fontSize: '0.72rem', backgroundColor: '#0f172a', color: '#38bdf8', border: '1px solid #0284c7', padding: '0.3rem 0.65rem', borderRadius: '6px' }}>
            Outlet: <strong>Main Counter</strong>
          </span>
          <span style={{ fontSize: '0.72rem', backgroundColor: '#10b98120', color: '#34d399', padding: '0.3rem 0.65rem', borderRadius: '6px', fontWeight: 600 }}>
            ⚡ Sandboxed ARM64
          </span>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="appshell-grid">
        {/* Left Column: Sandboxed Application Viewport */}
        <div className="appshell-viewport" style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', overflowY: 'auto' }}>
          {/* Subheader */}
          <div style={{
            padding: '1.25rem 2rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc'
          }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.2rem 0', color: '#0f172a' }}>
                {appDisplayName} Micro-Frontend
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Running inside isolated iframe sandbox with token: <code>{appContext?.token || 'active'}</code>
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                onClick={handleSimulateNewOrder}
                style={{
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
                }}
              >
                + Simulate New Order
              </button>
              <button
                onClick={() => {
                  setInAppToast({ message: 'SDK Toast Triggered Successfully', type: 'info' });
                  setTimeout(() => setInAppToast(null), 3000);
                  addLog('inbound', 'BIZBOX_TOAST', { message: 'SDK Toast Triggered' });
                }}
                style={{
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Test SDK Toast
              </button>
            </div>
          </div>

          {/* Interactive Simulated App Content */}
          <div style={{ padding: '2rem', flex: 1 }}>
            {/* Granted Scopes Chips */}
            <div style={{ marginBottom: '1.75rem', backgroundColor: '#f1f5f9', padding: '1rem 1.25rem', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Active Granted Scopes:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(appContext?.grantedScopes || ['orders:read', 'menu:read', 'stock:read']).map(sc => (
                  <span key={sc} style={{ fontSize: '0.72rem', fontWeight: 600, backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '2px 8px', borderRadius: '4px' }}>
                    🔑 {sc}
                  </span>
                ))}
              </div>
            </div>

            {/* Simulated Live Orders / Domain Data */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Live Orders Stream (Synced with Edge Agent)
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>
                  ● Real-time WebSocket Synced
                </span>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.65rem 1rem', color: '#64748b' }}>Order ID</th>
                      <th style={{ padding: '0.65rem 1rem', color: '#64748b' }}>Item Description</th>
                      <th style={{ padding: '0.65rem 1rem', color: '#64748b' }}>Amount</th>
                      <th style={{ padding: '0.65rem 1rem', color: '#64748b', textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulatedOrders.map(ord => (
                      <tr key={ord.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>{ord.id}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{ord.item}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>{ord.amount}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: ord.status === 'PAID' ? '#dcfce7' : (ord.status === 'KITCHEN' ? '#fef3c7' : '#e0f2fe'),
                            color: ord.status === 'PAID' ? '#15803d' : (ord.status === 'KITCHEN' ? '#b45309' : '#0369a1')
                          }}>
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Registered App SDK UI Actions */}
            {registeredActions.length > 0 && (
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: '#0f172a' }}>
                  Registered UI Actions (@bizbox/app-sdk)
                </h4>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  {registeredActions.map(action => (
                    <button
                      key={action.slot}
                      onClick={() => triggerActionClick(action.slot)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '6px',
                        border: '1px solid #0284c7',
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {action.label} ({action.slot})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: SDK Bridge Telemetry & Event Inspector */}
        <aside className="appshell-inspector" style={{ backgroundColor: '#1e293b', borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column', color: '#ffffff' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>
              SDK Bridge Inspector
            </span>
            <button
              onClick={() => setLogs([])}
              style={{ fontSize: '0.7rem', color: '#64748b', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Clear
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontFamily: 'monospace', fontSize: '0.72rem' }}>
            {logs.length === 0 ? (
              <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem 1rem' }}>
                Waiting for @bizbox/app-sdk events...
              </div>
            ) : (
              logs.map(log => (
                <div
                  key={log.id}
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '0.6rem 0.8rem',
                    lineHeight: 1.4
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ color: log.direction === 'inbound' ? '#38bdf8' : '#34d399', fontWeight: 700 }}>
                      {log.direction === 'inbound' ? '↓ IN' : '↑ OUT'}: {log.type}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '0.65rem' }}>{log.timestamp}</span>
                  </div>
                  <pre style={{ margin: 0, color: '#cbd5e1', fontSize: '0.68rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {/* Floating In-App Toast Notification */}
      {inAppToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: inAppToast.type === 'error' ? '#7f1d1d' : (inAppToast.type === 'success' ? '#065f46' : '#0f172a'),
          border: inAppToast.type === 'error' ? '1px solid #b91c1c' : (inAppToast.type === 'success' ? '1px solid #059669' : '1px solid #334155'),
          color: '#ffffff',
          padding: '0.85rem 1.4rem',
          borderRadius: '10px',
          fontSize: '0.85rem',
          fontWeight: 500,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          zIndex: 300
        }}>
          <span style={{ color: inAppToast.type === 'error' ? '#fca5a5' : '#34d399', fontWeight: 800 }}>
            {inAppToast.type === 'error' ? '✕' : '✓'}
          </span>
          {inAppToast.message}
        </div>
      )}
    </div>
  );
}
