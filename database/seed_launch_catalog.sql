-- ==============================================================================
-- Seed Data: BizBox App Store Launch Catalog (22 Apps)
-- FlutterFlirt Private Limited & Partner Pilot Apps
-- ==============================================================================

-- 1. Insert Developers
INSERT INTO store.developers (id, slug, name, type, email, website, gstin, is_verified, revenue_share_pct)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'flutterflirt', 'FlutterFlirt Private Limited', 'company', 'dev@flutterflirt.com', 'https://www.flutterflirt.com', '27AABCF1234F1Z1', true, 100.00),
    ('22222222-2222-2222-2222-222222222222', 'ledgerly', 'Ledgerly Technologies', 'company', 'support@ledgerly.in', 'https://ledgerly.in', '27AABCL5678L1Z2', true, 80.00),
    ('33333333-3333-3333-3333-333333333333', 'kitchenmetrics', 'KitchenMetrics Solutions', 'company', 'hello@kitchenmetrics.io', 'https://kitchenmetrics.io', '27AABCK9999K1Z3', true, 80.00)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Mock Tenant for testing
INSERT INTO pos.tenants (id, name, business_type)
VALUES ('00000000-0000-0000-0000-000000000001', 'Brew & Bites Cafe', 'Cafe')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert 22 Launch Apps
INSERT INTO store.apps (
    id, developer_id, slug, package_id, name, tagline, category, 
    business_types, description_md, icon_url, runtime, status, is_featured, is_core, rating_avg, rating_count, install_count
) VALUES
-- 1. POS & Billing
('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'pos-billing', 'in.flutterflirt.pos', 
 'POS & Billing', 'Fast GST billing, tables, tokens and split payments', 'Sales & POS', 
 ARRAY['Restaurant', 'Cafe', 'Retail', 'QSR'], '# POS & Billing\nFast billing engine for all retail and dining outlets.', 
 '/icons/pos.svg', 'hybrid', 'published', true, true, 4.9, 120, 540),

-- 2. Kitchen Display
('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'kitchen-display', 'in.flutterflirt.kds', 
 'Kitchen Display', 'Paperless kitchen with station routing and prep timers', 'Kitchen', 
 ARRAY['Restaurant', 'Cafe', 'Cloud Kitchen'], '# Kitchen Display System\nRoute orders across multiple kitchen stations.', 
 '/icons/kds.svg', 'edge', 'published', true, false, 4.8, 85, 310),

-- 3. Captain App
('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'captain-app', 'in.flutterflirt.captain', 
 'Captain App', 'Waiters take orders at the table on a tablet', 'Sales & POS', 
 ARRAY['Restaurant', 'Dine-In'], '# Captain App\nEnable mobile table-side ordering for waiters.', 
 '/icons/captain.svg', 'edge', 'published', false, false, 4.7, 45, 180),

-- 4. Self-Order Kiosk
('a0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'self-order-kiosk', 'in.flutterflirt.kiosk', 
 'Self-Order Kiosk', 'Customers order and pay themselves, get a token', 'Sales & POS', 
 ARRAY['QSR', 'Food Court'], '# Self-Order Kiosk\nTouchscreen ordering kiosk app for guests.', 
 '/icons/kiosk.svg', 'edge', 'published', false, false, 4.6, 30, 95),

-- 5. QR Table Ordering
('a0000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'qr-table-ordering', 'in.flutterflirt.qr', 
 'QR Table Ordering', 'Scan the table QR, browse the menu, order to kitchen', 'Online orders', 
 ARRAY['Restaurant', 'Cafe', 'Brewery'], '# QR Table Ordering\nContactless digital menu and order management.', 
 '/icons/qr.svg', 'cloud', 'published', false, false, 4.8, 62, 240),

-- 6. Online Orders Hub
('a0000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'online-orders-hub', 'in.flutterflirt.hub', 
 'Online Orders Hub', 'Swiggy, Zomato, ONDC and website orders in one screen', 'Online orders', 
 ARRAY['Restaurant', 'Cloud Kitchen'], '# Online Orders Hub\nAggregate all 3rd party food aggregators.', 
 '/icons/hub.svg', 'cloud', 'published', true, false, 4.9, 140, 480),

-- 7. Inventory & Recipes
('a0000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'inventory-recipes', 'in.flutterflirt.inventory', 
 'Inventory & Recipes', 'Recipe-based stock, wastage, reorder alerts', 'Inventory', 
 ARRAY['Restaurant', 'Bakery', 'Retail'], '# Inventory & Recipes\nReal-time ingredient deduction on every bill.', 
 '/icons/inventory.svg', 'hybrid', 'published', true, false, 4.7, 98, 360),

-- 8. Purchase & Suppliers
('a0000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'purchase-suppliers', 'in.flutterflirt.purchases', 
 'Purchase & Suppliers', 'Purchase orders, goods receipt, supplier ledger', 'Inventory', 
 ARRAY['Retail', 'Restaurant', 'Supermarket'], '# Purchase & Suppliers\nTrack supplier inward and payments.', 
 '/icons/po.svg', 'cloud', 'published', false, false, 4.5, 34, 110),

-- 9. CRM & Loyalty
('a0000000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'crm-loyalty', 'in.flutterflirt.crm', 
 'CRM & Loyalty', 'Customer profiles, points, coupons and feedback', 'Customers', 
 ARRAY['All'], '# CRM & Loyalty\nBoost repeat visits with loyalty points and coupons.', 
 '/icons/crm.svg', 'cloud', 'published', false, false, 4.6, 75, 290),

-- 10. WhatsApp Marketing
('a0000000-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'whatsapp-marketing', 'in.flutterflirt.whatsapp', 
 'WhatsApp Marketing', 'E-receipts, campaigns and order updates on WhatsApp', 'Marketing', 
 ARRAY['All'], '# WhatsApp Marketing\nDeliver paperless bills and promotional messages via Meta API.', 
 '/icons/whatsapp.svg', 'cloud', 'published', true, false, 4.8, 110, 420),

-- 11. GST & Accounting
('a0000000-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'gst-accounting', 'in.flutterflirt.gst', 
 'GST & Accounting', 'GSTR-1 ready reports, day books and Tally export', 'Finance & GST', 
 ARRAY['All'], '# GST & Accounting\nAutomate GST reconciliation and daily book closures.', 
 '/icons/gst.svg', 'cloud', 'published', false, false, 4.9, 130, 490),

-- 12. Staff & Payroll
('a0000000-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'staff-payroll', 'in.flutterflirt.hr', 
 'Staff & Payroll', 'Attendance, shifts, salary and incentives', 'Staff', 
 ARRAY['All'], '# Staff & Payroll\nBiometric/PIN staff check-in and shift management.', 
 '/icons/hr.svg', 'hybrid', 'published', false, false, 4.4, 40, 160),

-- 13. Device Manager
('a0000000-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', 'device-manager', 'in.flutterflirt.devices', 
 'Device Manager', 'Monitor printers, screens, sensors and IoT units', 'Devices', 
 ARRAY['All'], '# Device Manager\nDiagnostic health and printer spooling management.', 
 '/icons/devices.svg', 'hybrid', 'published', false, true, 4.9, 150, 540),

-- 14. Service Desk
('a0000000-0000-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111', 'service-desk', 'in.flutterflirt.servicedesk', 
 'Service Desk', 'Customer tickets, technician visits and SLAs', 'Customers', 
 ARRAY['Service Centers', 'Repair Shops'], '# Service Desk\nTrack repair work orders and job sheets.', 
 '/icons/servicedesk.svg', 'cloud', 'published', false, false, 4.3, 18, 70),

-- 15. Subscriptions & Billing
('a0000000-0000-0000-0000-000000000015', '11111111-1111-1111-1111-111111111111', 'subscriptions-billing', 'in.flutterflirt.subscriptions', 
 'Subscriptions & Billing', 'Recurring plans, auto-invoices and UPI AutoPay', 'Finance & GST', 
 ARRAY['Gyms', 'Classes', 'Clubs'], '# Subscriptions & Billing\nCollect repeat membership payments automatically.', 
 '/icons/sub.svg', 'cloud', 'published', false, false, 4.5, 29, 115),

-- 16. Reports & Analytics
('a0000000-0000-0000-0000-000000000016', '11111111-1111-1111-1111-111111111111', 'reports-analytics', 'in.flutterflirt.bi', 
 'Reports & Analytics', 'Live dashboards across outlets, exports and alerts', 'Analytics', 
 ARRAY['All'], '# Reports & Analytics\nExecutive dashboard with hourly sales and heatmaps.', 
 '/icons/bi.svg', 'cloud', 'published', false, false, 4.8, 88, 380),

-- 17. BizBox AI Assistant
('a0000000-0000-0000-0000-000000000017', '11111111-1111-1111-1111-111111111111', 'bizbox-ai-assistant', 'in.flutterflirt.ai', 
 'BizBox AI Assistant', 'Ask your business anything — runs on the box, offline', 'AI', 
 ARRAY['All'], '# BizBox AI Assistant\nNatural language insights powered by local on-box LLM.', 
 '/icons/ai.svg', 'edge', 'published', true, false, 4.9, 95, 220),

-- 18. Online Store
('a0000000-0000-0000-0000-000000000018', '11111111-1111-1111-1111-111111111111', 'online-store', 'in.flutterflirt.store', 
 'Online Store', 'Your own ordering website with UPI checkout', 'Online orders', 
 ARRAY['Retail', 'Restaurant'], '# Online Store\nLaunch a branded direct-to-consumer store.', 
 '/icons/store.svg', 'cloud', 'published', false, false, 4.6, 52, 210),

-- 19. Appointments
('a0000000-0000-0000-0000-000000000019', '11111111-1111-1111-1111-111111111111', 'appointments', 'in.flutterflirt.appointments', 
 'Appointments', 'Bookings for salons, clinics and studios with reminders', 'Industry', 
 ARRAY['Salons', 'Clinics', 'Spas'], '# Appointments\nCalendar booking system with automated SMS/WhatsApp alerts.', 
 '/icons/appointments.svg', 'cloud', 'published', false, false, 4.7, 36, 140),

-- 20. Pharmacy Suite
('a0000000-0000-0000-0000-000000000020', '11111111-1111-1111-1111-111111111111', 'pharmacy-suite', 'in.flutterflirt.pharmacy', 
 'Pharmacy Suite', 'Batches, expiry alerts, schedule-drug register', 'Industry', 
 ARRAY['Pharmacy', 'Healthcare'], '# Pharmacy Suite\nStrict batch expiry controls and schedule H compliance.', 
 '/icons/pharmacy.svg', 'hybrid', 'published', false, false, 4.8, 27, 90),

-- 21. TallyBridge (Partner App: Ledgerly)
('a0000000-0000-0000-0000-000000000021', '22222222-2222-2222-2222-222222222222', 'tallybridge', 'in.ledgerly.tallybridge', 
 'TallyBridge', 'Two-way sync of sales, purchases and stock with Tally', 'Finance & GST', 
 ARRAY['All'], '# TallyBridge\nSeamless real-time synchronization with TallyPrime.', 
 '/icons/tally.svg', 'cloud', 'published', false, false, 4.7, 60, 230),

-- 22. FoodCost Pro (Partner App: KitchenMetrics)
('a0000000-0000-0000-0000-000000000022', '33333333-3333-3333-3333-333333333333', 'foodcost-pro', 'in.kitchenmetrics.foodcost-pro', 
 'FoodCost Pro', 'Menu engineering and food-cost % by dish', 'Analytics', 
 ARRAY['Restaurant', 'Cafe', 'Bar'], '# FoodCost Pro\nOptimize plate margins and discover star dishes.', 
 '/icons/foodcost.svg', 'cloud', 'published', true, false, 4.8, 48, 190)
ON CONFLICT (slug) DO NOTHING;

-- 4. Pricing Plans for the 22 Launch Apps
INSERT INTO store.app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
VALUES
('a0000000-0000-0000-0000-000000000001', 'free', 'Core Billing Free', 'outlet', 0.00, 0.00, 0),
('a0000000-0000-0000-0000-000000000002', 'standard', 'KDS Standard', 'outlet', 499.00, 4990.00, 14),
('a0000000-0000-0000-0000-000000000003', 'standard', 'Captain Per Device', 'device', 299.00, 2990.00, 14),
('a0000000-0000-0000-0000-000000000004', 'standard', 'Kiosk Per Device', 'device', 799.00, 7990.00, 14),
('a0000000-0000-0000-0000-000000000005', 'standard', 'QR Ordering', 'outlet', 399.00, 3990.00, 14),
('a0000000-0000-0000-0000-000000000006', 'standard', 'Aggregator Sync', 'outlet', 999.00, 9990.00, 14),
('a0000000-0000-0000-0000-000000000007', 'standard', 'Recipe Stock Engine', 'outlet', 799.00, 7990.00, 14),
('a0000000-0000-0000-0000-000000000008', 'standard', 'PO & Vendors', 'month', 499.00, 4990.00, 14),
('a0000000-0000-0000-0000-000000000009', 'standard', 'Loyalty Pro', 'month', 599.00, 5990.00, 14),
('a0000000-0000-0000-0000-000000000010', 'standard', 'WhatsApp Suite', 'month', 699.00, 6990.00, 14),
('a0000000-0000-0000-0000-000000000011', 'standard', 'GST Filing Ready', 'month', 999.00, 9990.00, 14),
('a0000000-0000-0000-0000-000000000012', 'standard', 'Payroll Per User', 'user', 49.00, 490.00, 14),
('a0000000-0000-0000-0000-000000000013', 'free', 'Device Hub Free', 'outlet', 0.00, 0.00, 0),
('a0000000-0000-0000-0000-000000000014', 'standard', 'Help Desk Pro', 'month', 499.00, 4990.00, 14),
('a0000000-0000-0000-0000-000000000015', 'standard', 'AutoPay Mandates', 'month', 599.00, 5990.00, 14),
('a0000000-0000-0000-0000-000000000016', 'standard', 'Multi-Outlet Analytics', 'month', 499.00, 4990.00, 14),
('a0000000-0000-0000-0000-000000000017', 'standard', 'On-Box AI Core', 'month', 999.00, 9990.00, 14),
('a0000000-0000-0000-0000-000000000018', 'standard', 'Custom Web Store', 'month', 799.00, 7990.00, 14),
('a0000000-0000-0000-0000-000000000019', 'standard', 'Salon & Clinic Booking', 'month', 599.00, 5990.00, 14),
('a0000000-0000-0000-0000-000000000020', 'standard', 'Pharma Batch Control', 'outlet', 999.00, 9990.00, 14),
('a0000000-0000-0000-0000-000000000021', 'standard', 'Tally Sync Bridge', 'month', 349.00, 3490.00, 14),
('a0000000-0000-0000-0000-000000000022', 'standard', 'Food Cost & Margins', 'month', 449.00, 4490.00, 14)
ON CONFLICT (app_id, code) DO NOTHING;
