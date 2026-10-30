import React from 'react';

// 22 Launch Apps Catalog from BizBox specification
const LAUNCH_APPS = [
  { id: '1', name: 'POS & Billing', cat: 'Sales & POS', price: 'Free', runs: 'Box + cloud', badge: 'Core' },
  { id: '2', name: 'Kitchen Display', cat: 'Kitchen', price: '₹499/outlet/mo', runs: 'BizBox box', badge: 'Edge' },
  { id: '3', name: 'Captain App', cat: 'Sales & POS', price: '₹299/device/mo', runs: 'BizBox box', badge: 'Edge' },
  { id: '4', name: 'Self-Order Kiosk', cat: 'Sales & POS', price: '₹799/device/mo', runs: 'BizBox box', badge: 'Edge' },
  { id: '5', name: 'QR Table Ordering', cat: 'Online orders', price: '₹399/outlet/mo', runs: 'Cloud', badge: 'Cloud' },
  { id: '6', name: 'Online Orders Hub', cat: 'Online orders', price: '₹999/outlet/mo', runs: 'Cloud', badge: 'Popular' },
  { id: '7', name: 'Inventory & Recipes', cat: 'Inventory', price: '₹799/outlet/mo', runs: 'Box + cloud', badge: 'Hybrid' },
  { id: '8', name: 'Purchase & Suppliers', cat: 'Inventory', price: '₹499/month', runs: 'Cloud', badge: 'Cloud' },
  { id: '9', name: 'CRM & Loyalty', cat: 'Customers', price: '₹599/month', runs: 'Cloud', badge: 'Cloud' },
  { id: '10', name: 'WhatsApp Marketing', cat: 'Marketing', price: '₹699/month', runs: 'Cloud', badge: 'Popular' },
  { id: '11', name: 'GST & Accounting', cat: 'Finance & GST', price: '₹999/month', runs: 'Cloud', badge: 'Cloud' },
  { id: '12', name: 'Staff & Payroll', cat: 'Staff', price: '₹49/user/mo', runs: 'Box + cloud', badge: 'Hybrid' },
  { id: '13', name: 'Device Manager', cat: 'Devices', price: 'Free', runs: 'Box + cloud', badge: 'Core' },
  { id: '14', name: 'Service Desk', cat: 'Customers', price: '₹499/month', runs: 'Cloud', badge: 'Cloud' },
  { id: '15', name: 'Subscriptions & Billing', cat: 'Finance & GST', price: '₹599/month', runs: 'Cloud', badge: 'Cloud' },
  { id: '16', name: 'Reports & Analytics', cat: 'Analytics', price: '₹499/month', runs: 'Cloud', badge: 'Cloud' },
  { id: '17', name: 'BizBox AI Assistant', cat: 'AI', price: '₹999/month', runs: 'BizBox box', badge: 'Edge' },
  { id: '18', name: 'Online Store', cat: 'Online orders', price: '₹799/month', runs: 'Cloud', badge: 'Cloud' },
  { id: '19', name: 'Appointments', cat: 'Industry', price: '₹599/month', runs: 'Cloud', badge: 'Cloud' },
  { id: '20', name: 'Pharmacy Suite', cat: 'Industry', price: '₹999/outlet/mo', runs: 'Box + cloud', badge: 'Hybrid' },
  { id: '21', name: 'TallyBridge', cat: 'Finance & GST', price: '₹349/month', runs: 'Cloud', badge: 'Partner' },
  { id: '22', name: 'FoodCost Pro', cat: 'Analytics', price: '₹449/month', runs: 'Cloud', badge: 'Partner' }
];

export default function StoreHomePage() {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#0b0f19', color: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
      <header style={{ borderBottom: '1px solid #1e293b', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>BizBox App Store</h1>
            <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Everything your business runs on. Billing, Kitchen, AI, and Integrations.</p>
          </div>
          <input 
            type="search" 
            placeholder="Search all 22 apps, categories, features..." 
            style={{ padding: '0.6rem 1rem', width: '320px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff' }}
          />
        </div>
      </header>

      {/* Hero Rails */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#e2e8f0' }}>Featured Collections</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Kitchen Automation</h3>
            <p style={{ margin: 0, opacity: 0.9 }}>KDS, Captain tablets & Self-Order kiosks running offline on the Pi 5 box.</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Online Growth & Delivery</h3>
            <p style={{ margin: 0, opacity: 0.9 }}>Direct Swiggy, Zomato, ONDC & WhatsApp Marketing in one centralized hub.</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #d946ef 0%, #ec4899 100%)', padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>AI & Smart Inventory</h3>
            <p style={{ margin: 0, opacity: 0.9 }}>Local offline LLM + real-time recipe-level wastage controls.</p>
          </div>
        </div>
      </section>

      {/* Catalog Grid */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#e2e8f0' }}>All Launch Apps ({LAUNCH_APPS.length})</h2>
          <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>14-day free trial on all paid apps</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {LAUNCH_APPS.map((app) => (
            <div key={app.id} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: '#334155', color: '#cbd5e1' }}>{app.cat}</span>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: '#3b82f620', color: '#60a5fa' }}>{app.runs}</span>
                </div>
                <h4 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '1.1rem', color: '#ffffff' }}>{app.name}</h4>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: '#38bdf8' }}>{app.price}</span>
                <button style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  Install
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
