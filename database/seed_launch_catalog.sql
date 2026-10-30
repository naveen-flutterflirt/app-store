
-- Test Tenant & Device
INSERT INTO pos.tenants (id, name, business_type)
VALUES ('00000000-0000-0000-0000-000000000001', 'Brew & Bites Cafe', 'cafe')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pos.devices (id, tenant_id, name, device_type, serial_number, device_token, is_online)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Counter Pi5', 'pi5_box', 'PI5-BLR-001', 'tok_pi5_mock_device', true)
ON CONFLICT (id) DO NOTHING;

SET search_path = store, pos, public;

INSERT INTO developers (slug, name, type, email, is_verified, revenue_share_pct) VALUES
  ('flutterflirt','FlutterFlirt','first_party','info@flutterflirt.com',true,100),
  ('ledgerly','Ledgerly','partner','ledgerly@example.com',true,80),
  ('kitchenmetrics','KitchenMetrics','partner','kitchenmetrics@example.com',true,80);

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'pos', 'in.flutterflirt.pos', 'POS & Billing', 'Fast GST billing, tables, tokens and split payments', 'sales', ARRAY['all']::text[],
         'hybrid', 'draft', true, true FROM developers WHERE slug = 'flutterflirt'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.flutterflirt.pos", "version": "1.0.0", "runtime": "hybrid", "scopes": ["orders:write", "menu:read", "payments:write", "customers:read"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/pos/1.0.0/bundle.tgz', '7160f8688035138fcbc9a6c8041949ebea0c0d21a1b1d063f839f38d5c2be8f9',
         'registry.bizbox.in/pos@sha256:7160f8688035138fcbc9a6c8041949ebea0c0d21a1b1d063f839f38d5c2be8f9', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'free', 'Free', 'free', 0, 0, 0 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'kds', 'in.flutterflirt.kds', 'Kitchen Display', 'Paperless kitchen with station routing and prep timers', 'kitchen', ARRAY['cafe','restaurant','qsr','cloud_kitchen']::text[],
         'edge', 'draft', false, true FROM developers WHERE slug = 'flutterflirt'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.flutterflirt.kds", "version": "1.0.0", "runtime": "edge", "scopes": ["orders:read", "kots:write"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/kds/1.0.0/bundle.tgz', '6a7e57a704c8e4c67bb13a32072cf06b9c8d272fc0591b91fc6784e11b58188f',
         'registry.bizbox.in/kds@sha256:6a7e57a704c8e4c67bb13a32072cf06b9c8d272fc0591b91fc6784e11b58188f', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'standard', 'Standard', 'outlet', 499, 4990, 14 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'captain', 'in.flutterflirt.captain', 'Captain App', 'Waiters take orders at the table on a tablet', 'sales', ARRAY['restaurant','cafe']::text[],
         'edge', 'draft', false, false FROM developers WHERE slug = 'flutterflirt'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.flutterflirt.captain", "version": "1.0.0", "runtime": "edge", "scopes": ["orders:write", "tables:write"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/captain/1.0.0/bundle.tgz', '2780b8eef998d6eaca5dbfe00e4043e626c79bc214195e1848af17a85d51519c',
         'registry.bizbox.in/captain@sha256:2780b8eef998d6eaca5dbfe00e4043e626c79bc214195e1848af17a85d51519c', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'standard', 'Standard', 'device', 299, 2990, 14 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'kiosk', 'in.flutterflirt.kiosk', 'Self-Order Kiosk', 'Customers order and pay themselves, get a token', 'sales', ARRAY['qsr','cafe']::text[],
         'edge', 'draft', false, false FROM developers WHERE slug = 'flutterflirt'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.flutterflirt.kiosk", "version": "1.0.0", "runtime": "edge", "scopes": ["orders:write", "payments:write"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/kiosk/1.0.0/bundle.tgz', 'd99cff6fc8a2f1fbc39e1c8f4f9eb28d692c40900bbb3486b426a13da37b79a0',
         'registry.bizbox.in/kiosk@sha256:d99cff6fc8a2f1fbc39e1c8f4f9eb28d692c40900bbb3486b426a13da37b79a0', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'standard', 'Standard', 'device', 799, 7990, 14 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'qr-order', 'in.flutterflirt.qr-order', 'QR Table Ordering', 'Scan the table QR, browse the menu, order to kitchen', 'online', ARRAY['cafe','restaurant']::text[],
         'cloud', 'draft', false, false FROM developers WHERE slug = 'flutterflirt'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.flutterflirt.qr-order", "version": "1.0.0", "runtime": "cloud", "scopes": ["orders:write", "menu:read"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/qr-order/1.0.0/bundle.tgz', '7d65929799dd39553743f2786893b10dea139cd81a5d6450bcb63e24b747c651',
         'registry.bizbox.in/qr-order@sha256:7d65929799dd39553743f2786893b10dea139cd81a5d6450bcb63e24b747c651', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'standard', 'Standard', 'outlet', 399, 3990, 14 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'online-hub', 'in.flutterflirt.online-hub', 'Online Orders Hub', 'Swiggy, Zomato, ONDC and website orders in one screen', 'online', ARRAY['restaurant','cloud_kitchen','qsr']::text[],
         'cloud', 'draft', false, true FROM developers WHERE slug = 'flutterflirt'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.flutterflirt.online-hub", "version": "1.0.0", "runtime": "cloud", "scopes": ["orders:write", "menu:write"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/online-hub/1.0.0/bundle.tgz', '62c2509f4c0ff877b689386fadcabd8518b971dd83e543ddfbc98a9fcd001f1e',
         'registry.bizbox.in/online-hub@sha256:62c2509f4c0ff877b689386fadcabd8518b971dd83e543ddfbc98a9fcd001f1e', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'standard', 'Standard', 'outlet', 999, 9990, 14 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'inventory', 'in.flutterflirt.inventory', 'Inventory & Recipes', 'Recipe-based stock, wastage, reorder alerts', 'inventory', ARRAY['all']::text[],
         'hybrid', 'draft', false, true FROM developers WHERE slug = 'flutterflirt'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.flutterflirt.inventory", "version": "1.0.0", "runtime": "hybrid", "scopes": ["stock:write", "menu:read"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/inventory/1.0.0/bundle.tgz', 'b11a85b296a90afc460430434a504e7acb04b064575b7277724688af0e59d189',
         'registry.bizbox.in/inventory@sha256:b11a85b296a90afc460430434a504e7acb04b064575b7277724688af0e59d189', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'standard', 'Standard', 'outlet', 799, 7990, 14 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'purchase', 'in.flutterflirt.purchase', 'Purchase & Suppliers', 'Purchase orders, goods receipt, supplier ledger', 'inventory', ARRAY['all']::text[],
         'cloud', 'draft', false, false FROM developers WHERE slug = 'flutterflirt'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.flutterflirt.purchase", "version": "1.0.0", "runtime": "cloud", "scopes": ["stock:write", "suppliers:write"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/purchase/1.0.0/bundle.tgz', '7048dc8aa7663e713097535171b4ed72ab015705a885de9636e66d4b1fa18804',
         'registry.bizbox.in/purchase@sha256:7048dc8aa7663e713097535171b4ed72ab015705a885de9636e66d4b1fa18804', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'standard', 'Standard', 'tenant', 499, 4990, 14 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'crm', 'in.flutterflirt.crm', 'CRM & Loyalty', 'Customer profiles, points, coupons and feedback', 'customers', ARRAY['all']::text[],
         'cloud', 'draft', false, false FROM developers WHERE slug = 'flutterflirt'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.flutterflirt.crm", "version": "1.0.0", "runtime": "cloud", "scopes": ["customers:pii", "orders:read"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/crm/1.0.0/bundle.tgz', '9261ceef0b969e70ac20f1510f07a1e0d8db05f20c75161a2ef43b4eba27a7aa',
         'registry.bizbox.in/crm@sha256:9261ceef0b969e70ac20f1510f07a1e0d8db05f20c75161a2ef43b4eba27a7aa', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'standard', 'Standard', 'tenant', 599, 5990, 14 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'whatsapp', 'in.flutterflirt.whatsapp', 'WhatsApp Marketing', 'E-receipts, campaigns and order updates on WhatsApp', 'marketing', ARRAY['all']::text[],
         'cloud', 'draft', false, false FROM developers WHERE slug = 'flutterflirt'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.flutterflirt.whatsapp", "version": "1.0.0", "runtime": "cloud", "scopes": ["customers:pii", "invoices:read"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/whatsapp/1.0.0/bundle.tgz', 'ec8202b6f9fb16f9e26b66367afa4e037752f3c09a18cefab426165e06a424b1',
         'registry.bizbox.in/whatsapp@sha256:ec8202b6f9fb16f9e26b66367afa4e037752f3c09a18cefab426165e06a424b1', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'standard', 'Standard', 'tenant', 699, 6990, 7 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'accounts', 'in.flutterflirt.accounts', 'GST & Accounting', 'GSTR-1 ready reports, day books and Tally export', 'finance', ARRAY['all']::text[],
         'cloud', 'draft', false, true FROM developers WHERE slug = 'flutterflirt'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.flutterflirt.accounts", "version": "1.0.0", "runtime": "cloud", "scopes": ["invoices:read", "payments:read"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/accounts/1.0.0/bundle.tgz', 'bc62a3c14fec277e3dc6b504bf7c6348c2e421f8acc42032deddb0a96070f078',
         'registry.bizbox.in/accounts@sha256:bc62a3c14fec277e3dc6b504bf7c6348c2e421f8acc42032deddb0a96070f078', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'standard', 'Standard', 'tenant', 999, 9990, 14 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'staff', 'in.flutterflirt.staff', 'Staff & Payroll', 'Attendance, shifts, salary and incentives', 'people', ARRAY['all']::text[],
         'hybrid', 'draft', false, false FROM developers WHERE slug = 'flutterflirt'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.flutterflirt.staff", "version": "1.0.0", "runtime": "hybrid", "scopes": ["staff:write"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/staff/1.0.0/bundle.tgz', '1562206543da764123c21bd524674f0a8aaf49c8a89744c97352fe677f7e4006',
         'registry.bizbox.in/staff@sha256:1562206543da764123c21bd524674f0a8aaf49c8a89744c97352fe677f7e4006', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'standard', 'Standard', 'user', 49, 490, 14 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'devices', 'in.flutterflirt.devices', 'Device Manager', 'Monitor printers, screens, sensors and IoT units', 'devices', ARRAY['all']::text[],
         'hybrid', 'draft', true, false FROM developers WHERE slug = 'flutterflirt'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.flutterflirt.devices", "version": "1.0.0", "runtime": "hybrid", "scopes": ["devices:control"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/devices/1.0.0/bundle.tgz', 'ade15a1287dabe92c77ad32bbfada2ba4f6593433011b090530bd2fa0d86d8a0',
         'registry.bizbox.in/devices@sha256:ade15a1287dabe92c77ad32bbfada2ba4f6593433011b090530bd2fa0d86d8a0', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'free', 'Free', 'free', 0, 0, 0 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'service-desk', 'in.flutterflirt.service-desk', 'Service Desk', 'Customer tickets, technician visits and SLAs', 'customers', ARRAY['retail','services']::text[],
         'cloud', 'draft', false, false FROM developers WHERE slug = 'flutterflirt'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.flutterflirt.service-desk", "version": "1.0.0", "runtime": "cloud", "scopes": ["customers:pii", "tickets:write"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/service-desk/1.0.0/bundle.tgz', 'd163cc6102309298fe1638cdb8a273e4c15f5d28bf1b546f6cd40f95780843ca',
         'registry.bizbox.in/service-desk@sha256:d163cc6102309298fe1638cdb8a273e4c15f5d28bf1b546f6cd40f95780843ca', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'standard', 'Standard', 'tenant', 499, 4990, 14 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'subscriptions', 'in.flutterflirt.subscriptions', 'Subscriptions & Billing', 'Recurring plans, auto-invoices and UPI AutoPay', 'finance', ARRAY['services','retail']::text[],
         'cloud', 'draft', false, false FROM developers WHERE slug = 'flutterflirt'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.flutterflirt.subscriptions", "version": "1.0.0", "runtime": "cloud", "scopes": ["invoices:write", "customers:pii"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/subscriptions/1.0.0/bundle.tgz', '9cac91c1f544236a75db4457d3f608dc9c4c6d02b7df74a1b7eed08ccc24437c',
         'registry.bizbox.in/subscriptions@sha256:9cac91c1f544236a75db4457d3f608dc9c4c6d02b7df74a1b7eed08ccc24437c', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'standard', 'Standard', 'tenant', 599, 5990, 14 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'analytics', 'in.flutterflirt.analytics', 'Reports & Analytics', 'Live dashboards across outlets, exports and alerts', 'analytics', ARRAY['all']::text[],
         'cloud', 'draft', false, false FROM developers WHERE slug = 'flutterflirt'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.flutterflirt.analytics", "version": "1.0.0", "runtime": "cloud", "scopes": ["orders:read", "invoices:read", "stock:read"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/analytics/1.0.0/bundle.tgz', '65f98121a162a56ad8ee919ed9ea394b9eabd8714616acf30636c6092ee350b9',
         'registry.bizbox.in/analytics@sha256:65f98121a162a56ad8ee919ed9ea394b9eabd8714616acf30636c6092ee350b9', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'standard', 'Standard', 'tenant', 499, 4990, 14 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'ai', 'in.flutterflirt.ai', 'BizBox AI Assistant', 'Ask your business anything — runs on the box, offline', 'ai', ARRAY['all']::text[],
         'edge', 'draft', false, true FROM developers WHERE slug = 'flutterflirt'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.flutterflirt.ai", "version": "1.0.0", "runtime": "edge", "scopes": ["orders:read", "stock:read", "invoices:read"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/ai/1.0.0/bundle.tgz', '32e83e92d45d71f69dcf9d214688f0375542108631b45d344e5df2eb91c11566',
         'registry.bizbox.in/ai@sha256:32e83e92d45d71f69dcf9d214688f0375542108631b45d344e5df2eb91c11566', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'standard', 'Standard', 'tenant', 999, 9990, 14 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'webstore', 'in.flutterflirt.webstore', 'Online Store', 'Your own ordering website with UPI checkout', 'online', ARRAY['retail','bakery','restaurant']::text[],
         'cloud', 'draft', false, false FROM developers WHERE slug = 'flutterflirt'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.flutterflirt.webstore", "version": "1.0.0", "runtime": "cloud", "scopes": ["menu:read", "orders:write", "payments:write"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/webstore/1.0.0/bundle.tgz', '64aa12d9f2757efe74a1a57c4a40f430da428eb72b244477a68329e60cdb35f8',
         'registry.bizbox.in/webstore@sha256:64aa12d9f2757efe74a1a57c4a40f430da428eb72b244477a68329e60cdb35f8', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'standard', 'Standard', 'tenant', 799, 7990, 14 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'booking', 'in.flutterflirt.booking', 'Appointments', 'Bookings for salons, clinics and studios with reminders', 'industry', ARRAY['salon','clinic']::text[],
         'cloud', 'draft', false, false FROM developers WHERE slug = 'flutterflirt'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.flutterflirt.booking", "version": "1.0.0", "runtime": "cloud", "scopes": ["customers:pii", "calendar:write"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/booking/1.0.0/bundle.tgz', '001d057c49888db925f47ba4f0cbb75edf527893381dc5a27d7a965c766508c4',
         'registry.bizbox.in/booking@sha256:001d057c49888db925f47ba4f0cbb75edf527893381dc5a27d7a965c766508c4', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'standard', 'Standard', 'tenant', 599, 5990, 14 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'pharmacy', 'in.flutterflirt.pharmacy', 'Pharmacy Suite', 'Batches, expiry alerts, schedule-drug register', 'industry', ARRAY['pharmacy']::text[],
         'hybrid', 'draft', false, false FROM developers WHERE slug = 'flutterflirt'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.flutterflirt.pharmacy", "version": "1.0.0", "runtime": "hybrid", "scopes": ["stock:write", "orders:write"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/pharmacy/1.0.0/bundle.tgz', '20b04a4f018b89f369ce009213afc6369f59fe1c903c0770732ec7402163c358',
         'registry.bizbox.in/pharmacy@sha256:20b04a4f018b89f369ce009213afc6369f59fe1c903c0770732ec7402163c358', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'standard', 'Standard', 'outlet', 999, 9990, 14 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'tally-bridge', 'in.ledgerly.tally-bridge', 'TallyBridge', 'Two-way sync of sales, purchases and stock with Tally', 'finance', ARRAY['all']::text[],
         'cloud', 'draft', false, false FROM developers WHERE slug = 'ledgerly'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.ledgerly.tally-bridge", "version": "1.0.0", "runtime": "cloud", "scopes": ["invoices:read", "stock:read"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/tally-bridge/1.0.0/bundle.tgz', '9f47f5daf0736cc3be72087f666baaa09ceb153a417d7a28b9bea49bb185c569',
         'registry.bizbox.in/tally-bridge@sha256:9f47f5daf0736cc3be72087f666baaa09ceb153a417d7a28b9bea49bb185c569', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'standard', 'Standard', 'tenant', 349, 3490, 7 FROM a;

WITH a AS (
  INSERT INTO apps (developer_id, slug, package_id, name, tagline, category, business_types, runtime, status, is_core, is_featured)
  SELECT id, 'foodcost-pro', 'in.kitchenmetrics.foodcost-pro', 'FoodCost Pro', 'Menu engineering and food-cost % by dish', 'analytics', ARRAY['restaurant','cafe']::text[],
         'cloud', 'draft', false, false FROM developers WHERE slug = 'kitchenmetrics'
  RETURNING id
), v AS (
  INSERT INTO app_versions (app_id, version, manifest, bundle_url, bundle_sha256, image_ref, signature, status, rollout_pct, submitted_at)
  SELECT id, '1.0.0', '{"id": "in.kitchenmetrics.foodcost-pro", "version": "1.0.0", "runtime": "cloud", "scopes": ["orders:read", "stock:read", "menu:read"], "ui": {"slots": ["console.sidebar"]}, "resources": {"cpu": "0.25", "memory": "256Mi"}}'::jsonb, 's3://bizbox-apps/foodcost-pro/1.0.0/bundle.tgz', '87b4be705ad5e4bb42d470d94ce48d1405343693f1ccd55a80cc3c69092c2fe1',
         'registry.bizbox.in/foodcost-pro@sha256:87b4be705ad5e4bb42d470d94ce48d1405343693f1ccd55a80cc3c69092c2fe1', 'cosign:demo', 'approved', 100, now() - interval '30 days' FROM a
  RETURNING id
), c AS (
  INSERT INTO version_checks (version_id, kind, status, summary)
  SELECT v.id, k::check_kind, 'passed', 'ok' FROM v, unnest(ARRAY['manifest','security_scan','arm64_build','permissions']) k
), r AS (
  INSERT INTO version_reviews (version_id, reviewer, decision, notes) SELECT id, 'review@flutterflirt.com', 'approve', 'Launch catalog' FROM v
)
INSERT INTO app_plans (app_id, code, name, unit, price_month, price_year, trial_days)
SELECT id, 'standard', 'Standard', 'tenant', 449, 4490, 14 FROM a;

UPDATE app_versions SET status = 'published' WHERE status = 'approved';

INSERT INTO app_dependencies (app_id, requires_app, min_version)
SELECT a.id, p.id, '1.0.0' FROM apps a, apps p
WHERE p.slug = 'pos' AND a.slug IN ('kds','captain','kiosk','qr-order','online-hub','crm','inventory');
