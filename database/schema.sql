-- =====================================================================
-- Prerequisites for shared database (pos schema & helper functions)
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE SCHEMA IF NOT EXISTS pos;

CREATE OR REPLACE FUNCTION pos.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION pos.current_tenant()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE TABLE IF NOT EXISTS pos.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  business_type text NOT NULL DEFAULT 'restaurant',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pos.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES pos.tenants(id) ON DELETE CASCADE,
  email citext NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pos.devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES pos.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'edge',
  serial_number text UNIQUE,
  is_online boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE ROLE pos_app;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DROP SCHEMA IF EXISTS store CASCADE;
-- =====================================================================
--  BizBox App Store — PostgreSQL schema (v1.0)
--  FlutterFlirt Private Limited
--  Runs alongside the POS schema (pos.tenants, pos.users, pos.devices).
--  Covers: developer accounts, app listings, versions & publishing pipeline,
--          automated checks, human review, pricing plans, installs per tenant,
--          deployment to BizBox edge boxes, subscriptions, ratings, payouts.
-- =====================================================================
CREATE SCHEMA IF NOT EXISTS store;
SET search_path = store, pos, public;

CREATE TYPE store.app_category   AS ENUM ('sales','kitchen','inventory','customers','finance','people','devices','online','analytics','ai','marketing','industry');
CREATE TYPE store.dev_type       AS ENUM ('first_party','partner','independent');
CREATE TYPE store.listing_status AS ENUM ('draft','listed','unlisted','delisted');
CREATE TYPE store.version_status AS ENUM ('draft','submitted','checking','in_review','changes_requested','approved','published','rejected','withdrawn','superseded');
CREATE TYPE store.release_channel AS ENUM ('stable','beta','internal');
CREATE TYPE store.check_kind     AS ENUM ('manifest','dependencies','security_scan','license','arm64_build','permissions','performance','accessibility');
CREATE TYPE store.check_status   AS ENUM ('pending','running','passed','warning','failed');
CREATE TYPE store.review_decision AS ENUM ('approve','request_changes','reject');
CREATE TYPE store.price_unit     AS ENUM ('free','tenant','outlet','device','user');
CREATE TYPE store.install_status AS ENUM ('pending_payment','installing','active','update_available','suspended','uninstalled','failed');
CREATE TYPE store.deploy_status  AS ENUM ('queued','pulling','starting','running','failed','rolled_back','removed');
CREATE TYPE store.sub_status     AS ENUM ('trialing','active','past_due','cancelled','expired');
CREATE TYPE store.runtime_kind   AS ENUM ('cloud','edge','hybrid');

-- ---------------------------------------------------------------------
--  DEVELOPERS (publishers)
-- ---------------------------------------------------------------------
CREATE TABLE developers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             varchar(40) NOT NULL UNIQUE,
  name             text NOT NULL,
  type             dev_type NOT NULL DEFAULT 'partner',
  email            citext NOT NULL,
  website          text,
  gstin            varchar(15),
  is_verified      boolean NOT NULL DEFAULT false,
  revenue_share_pct numeric(5,2) NOT NULL DEFAULT 80 CHECK (revenue_share_pct BETWEEN 0 AND 100),  -- developer's share
  payout_ref       text,                                -- Razorpay Route linked account id (never raw bank details)
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE developer_members (
  developer_id  uuid NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  email         citext NOT NULL,
  role          text NOT NULL CHECK (role IN ('owner','admin','developer','finance')),
  added_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (developer_id, email)
);

-- ---------------------------------------------------------------------
--  APPS & LISTINGS
-- ---------------------------------------------------------------------
CREATE TABLE apps (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id    uuid NOT NULL REFERENCES developers(id),
  slug            varchar(50) NOT NULL UNIQUE,          -- bizbox.app/pos, used as package id: in.flutterflirt.pos
  package_id      varchar(80) NOT NULL UNIQUE,
  name            text NOT NULL,
  tagline         varchar(90) NOT NULL,
  category        app_category NOT NULL,
  business_types  text[] NOT NULL DEFAULT '{}',         -- cafe, restaurant, retail, pharmacy, salon, ...
  description_md  text NOT NULL DEFAULT '',
  icon_url        text,
  screenshots     text[] NOT NULL DEFAULT '{}',
  support_email   citext,
  privacy_url     text,
  runtime         runtime_kind NOT NULL DEFAULT 'hybrid',
  status          listing_status NOT NULL DEFAULT 'draft',
  is_featured     boolean NOT NULL DEFAULT false,
  is_core         boolean NOT NULL DEFAULT false,       -- pre-installed on every BizBox (POS, Devices)
  rating_avg      numeric(3,2) NOT NULL DEFAULT 0,
  rating_count    int NOT NULL DEFAULT 0,
  install_count   int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX apps_search ON apps USING gin ((name || ' ' || tagline) gin_trgm_ops);
CREATE INDEX ON apps (category) WHERE status = 'listed';

CREATE TABLE app_dependencies (                         -- e.g. KDS requires POS >= 1.4
  app_id         uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  requires_app   uuid NOT NULL REFERENCES apps(id),
  min_version    varchar(20) NOT NULL DEFAULT '0.0.0',
  PRIMARY KEY (app_id, requires_app),
  CHECK (app_id <> requires_app)
);

-- ---------------------------------------------------------------------
--  VERSIONS & PUBLISHING PIPELINE
-- ---------------------------------------------------------------------
CREATE TABLE app_versions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id            uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  version           varchar(20) NOT NULL CHECK (version ~ '^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$'),  -- semver
  channel           release_channel NOT NULL DEFAULT 'stable',
  manifest          jsonb NOT NULL,                     -- bizbox-app.json (scopes, events, UI slots, resources)
  bundle_url        text NOT NULL,                      -- s3://bizbox-apps/<pkg>/<ver>/bundle.tgz
  bundle_sha256     char(64) NOT NULL,
  image_ref         text,                               -- OCI image for edge: registry.bizbox.in/<pkg>@sha256:...
  signature         text,                               -- cosign signature, added on approval
  sbom_url          text,
  min_platform      varchar(20) NOT NULL DEFAULT '1.0.0',
  release_notes     text NOT NULL DEFAULT '',
  status            version_status NOT NULL DEFAULT 'draft',
  rollout_pct       smallint NOT NULL DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  submitted_by      citext,
  submitted_at      timestamptz,
  published_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (app_id, version)
);
CREATE INDEX ON app_versions (status) WHERE status IN ('submitted','checking','in_review');

CREATE TABLE version_scopes (                           -- permissions the app asks for
  version_id   uuid NOT NULL REFERENCES app_versions(id) ON DELETE CASCADE,
  scope        text NOT NULL,                           -- orders:read, menu:write, customers:pii, devices:control
  reason       text NOT NULL,
  is_sensitive boolean NOT NULL DEFAULT false,
  PRIMARY KEY (version_id, scope)
);

CREATE TABLE version_checks (                           -- automated pipeline results
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id   uuid NOT NULL REFERENCES app_versions(id) ON DELETE CASCADE,
  kind         check_kind NOT NULL,
  status       check_status NOT NULL DEFAULT 'pending',
  summary      text,
  report       jsonb NOT NULL DEFAULT '{}',
  started_at   timestamptz,
  finished_at  timestamptz,
  UNIQUE (version_id, kind)
);

CREATE TABLE version_reviews (                          -- human review by FlutterFlirt team
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id   uuid NOT NULL REFERENCES app_versions(id) ON DELETE CASCADE,
  reviewer     citext NOT NULL,
  decision     review_decision NOT NULL,
  notes        text NOT NULL DEFAULT '',
  checklist    jsonb NOT NULL DEFAULT '{}',             -- {"listing_accurate":true,"privacy_ok":true,...}
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
--  PRICING
-- ---------------------------------------------------------------------
CREATE TABLE app_plans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id        uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  code          varchar(30) NOT NULL,                   -- free, starter, pro
  name          text NOT NULL,
  unit          price_unit NOT NULL DEFAULT 'tenant',
  price_month   numeric(10,2) NOT NULL DEFAULT 0,       -- INR, excl. GST
  price_year    numeric(10,2),
  trial_days    int NOT NULL DEFAULT 0,
  limits        jsonb NOT NULL DEFAULT '{}',            -- {"outlets":1,"devices":3}
  is_active     boolean NOT NULL DEFAULT true,
  UNIQUE (app_id, code)
);

-- ---------------------------------------------------------------------
--  INSTALLATIONS (per business / tenant)
-- ---------------------------------------------------------------------
CREATE TABLE installations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES pos.tenants(id),
  app_id          uuid NOT NULL REFERENCES apps(id),
  version_id      uuid NOT NULL REFERENCES app_versions(id),
  plan_id         uuid REFERENCES app_plans(id),
  status          install_status NOT NULL DEFAULT 'installing',
  outlet_ids      uuid[] NOT NULL DEFAULT '{}',         -- empty = all outlets
  granted_scopes  text[] NOT NULL DEFAULT '{}',
  config          jsonb NOT NULL DEFAULT '{}',
  auto_update     boolean NOT NULL DEFAULT true,
  installed_by    uuid REFERENCES pos.users(id),
  installed_at    timestamptz NOT NULL DEFAULT now(),
  uninstalled_at  timestamptz,
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_live_install ON installations (tenant_id, app_id) WHERE status <> 'uninstalled';
CREATE INDEX ON installations (app_id, status);

CREATE TABLE edge_deployments (                         -- the app running on a BizBox box
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id  uuid NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
  device_id        uuid NOT NULL REFERENCES pos.devices(id),   -- device of type 'edge'
  version_id       uuid NOT NULL REFERENCES app_versions(id),
  status           deploy_status NOT NULL DEFAULT 'queued',
  container_id     text,
  cpu_pct          numeric(5,2),
  mem_mb           int,
  error            text,
  last_heartbeat   timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (installation_id, device_id)
);

CREATE TABLE subscriptions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id     uuid NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
  plan_id             uuid NOT NULL REFERENCES app_plans(id),
  status              sub_status NOT NULL DEFAULT 'trialing',
  quantity            int NOT NULL DEFAULT 1,           -- outlets / devices / users billed
  current_period_end  timestamptz NOT NULL,
  provider            text NOT NULL DEFAULT 'razorpay',
  provider_sub_id     text UNIQUE,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE oauth_clients (                            -- how an app calls the BizBox API
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id         uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  client_id      varchar(40) NOT NULL UNIQUE,
  secret_hash    text NOT NULL,
  redirect_uris  text[] NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE webhook_subscriptions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id  uuid NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
  event            text NOT NULL,                       -- order.created, payment.succeeded, stock.low
  target_url       text NOT NULL,
  secret_ref       text NOT NULL,
  is_active        boolean NOT NULL DEFAULT true,
  UNIQUE (installation_id, event, target_url)
);

-- ---------------------------------------------------------------------
--  RATINGS, USAGE, PAYOUTS
-- ---------------------------------------------------------------------
CREATE TABLE app_ratings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id      uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES pos.tenants(id),
  user_id     uuid REFERENCES pos.users(id),
  stars       smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment     text,
  dev_reply   text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (app_id, tenant_id)
);

CREATE TABLE usage_daily (
  installation_id  uuid NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
  day              date NOT NULL,
  api_calls        int NOT NULL DEFAULT 0,
  active_users     int NOT NULL DEFAULT 0,
  errors           int NOT NULL DEFAULT 0,
  PRIMARY KEY (installation_id, day)
);

CREATE TABLE payouts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id   uuid NOT NULL REFERENCES developers(id),
  period_start   date NOT NULL,
  period_end     date NOT NULL,
  gross          numeric(12,2) NOT NULL,
  platform_fee   numeric(12,2) NOT NULL,
  tds            numeric(12,2) NOT NULL DEFAULT 0,
  net            numeric(12,2) NOT NULL,
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','failed')),
  provider_ref   text,
  UNIQUE (developer_id, period_start)
);

CREATE TABLE store_audit (
  id          bigserial PRIMARY KEY,
  actor       citext NOT NULL,
  action      text NOT NULL,                            -- version.submit, version.approve, install.create, app.delist
  entity      text NOT NULL,
  entity_id   uuid,
  detail      jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
--  RULES (triggers & functions)
-- =====================================================================
CREATE TRIGGER trg_apps_upd BEFORE UPDATE ON apps FOR EACH ROW EXECUTE FUNCTION pos.set_updated_at();
CREATE TRIGGER trg_inst_upd BEFORE UPDATE ON installations FOR EACH ROW EXECUTE FUNCTION pos.set_updated_at();

-- Keep rating average and count on the app row
CREATE OR REPLACE FUNCTION store.refresh_rating() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE a uuid := COALESCE(NEW.app_id, OLD.app_id);
BEGIN
  UPDATE store.apps SET rating_avg = COALESCE((SELECT ROUND(AVG(stars)::numeric, 2) FROM store.app_ratings WHERE app_id = a), 0),
                        rating_count = (SELECT COUNT(*) FROM store.app_ratings WHERE app_id = a)
  WHERE id = a;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_rating AFTER INSERT OR UPDATE OR DELETE ON app_ratings FOR EACH ROW EXECUTE FUNCTION store.refresh_rating();

-- Keep install_count = live installations
CREATE OR REPLACE FUNCTION store.refresh_installs() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE a uuid := COALESCE(NEW.app_id, OLD.app_id);
BEGIN
  UPDATE store.apps SET install_count = (SELECT COUNT(*) FROM store.installations WHERE app_id = a AND status NOT IN ('uninstalled','failed')) WHERE id = a;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_installs AFTER INSERT OR UPDATE OF status OR DELETE ON installations FOR EACH ROW EXECUTE FUNCTION store.refresh_installs();

-- A version can only be published when every automated check passed (or warned) and a reviewer approved it.
CREATE OR REPLACE FUNCTION store.guard_publish() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status <> 'published' THEN
    IF EXISTS (SELECT 1 FROM store.version_checks WHERE version_id = NEW.id AND status NOT IN ('passed','warning'))
       OR NOT EXISTS (SELECT 1 FROM store.version_checks WHERE version_id = NEW.id) THEN
      RAISE EXCEPTION 'version % cannot be published: automated checks not all passed', NEW.version;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM store.version_reviews WHERE version_id = NEW.id AND decision = 'approve') THEN
      RAISE EXCEPTION 'version % cannot be published: no reviewer approval', NEW.version;
    END IF;
    IF NEW.signature IS NULL THEN
      RAISE EXCEPTION 'version % cannot be published: bundle is not signed', NEW.version;
    END IF;
    NEW.published_at := now();
    -- older published versions on the same channel become superseded once rollout reaches 100%
    IF NEW.rollout_pct = 100 THEN
      UPDATE store.app_versions SET status = 'superseded'
       WHERE app_id = NEW.app_id AND channel = NEW.channel AND status = 'published' AND id <> NEW.id;
    END IF;
    UPDATE store.apps SET status = 'listed' WHERE id = NEW.app_id AND status = 'draft';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_publish BEFORE UPDATE OF status ON app_versions FOR EACH ROW EXECUTE FUNCTION store.guard_publish();

-- Which version should a tenant get? Staged rollout: stable hash of tenant id picks a bucket 0–99.
CREATE OR REPLACE FUNCTION store.version_for_tenant(p_app uuid, p_tenant uuid, p_channel release_channel DEFAULT 'stable')
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT v.id FROM store.app_versions v
  WHERE v.app_id = p_app AND v.channel = p_channel AND v.status = 'published'
    AND (abs(hashtext(p_tenant::text)) % 100) < v.rollout_pct
  ORDER BY string_to_array(split_part(v.version, '-', 1), '.')::int[] DESC
  LIMIT 1
$$;

-- =====================================================================
--  VIEWS for the dashboards
-- =====================================================================
CREATE VIEW store.v_listing AS
SELECT a.id, a.slug, a.name, a.tagline, a.category, a.icon_url, a.rating_avg, a.rating_count, a.install_count,
       a.is_featured, a.is_core, d.name AS developer, d.is_verified,
       (SELECT v.version FROM store.app_versions v WHERE v.app_id = a.id AND v.status = 'published' AND v.channel = 'stable'
         ORDER BY v.published_at DESC LIMIT 1) AS latest_version,
       (SELECT MIN(p.price_month) FROM store.app_plans p WHERE p.app_id = a.id AND p.is_active) AS price_from
FROM store.apps a JOIN store.developers d ON d.id = a.developer_id
WHERE a.status = 'listed';

CREATE VIEW store.v_review_queue AS
SELECT v.id AS version_id, a.name AS app, d.name AS developer, v.version, v.channel, v.status, v.submitted_at,
       (SELECT COUNT(*) FROM store.version_checks c WHERE c.version_id = v.id AND c.status = 'failed')  AS checks_failed,
       (SELECT COUNT(*) FROM store.version_checks c WHERE c.version_id = v.id AND c.status = 'warning') AS checks_warning,
       (SELECT COUNT(*) FROM store.version_scopes s WHERE s.version_id = v.id AND s.is_sensitive)       AS sensitive_scopes
FROM store.app_versions v
JOIN store.apps a ON a.id = v.app_id JOIN store.developers d ON d.id = a.developer_id
WHERE v.status IN ('submitted','checking','in_review');

CREATE VIEW store.v_developer_mrr AS
SELECT d.id AS developer_id, d.name, a.name AS app,
       COUNT(s.*) FILTER (WHERE s.status IN ('active','trialing')) AS paying_installs,
       COALESCE(SUM(p.price_month * s.quantity) FILTER (WHERE s.status = 'active'), 0) AS mrr,
       ROUND(COALESCE(SUM(p.price_month * s.quantity) FILTER (WHERE s.status = 'active'), 0) * d.revenue_share_pct / 100, 2) AS developer_share
FROM store.developers d JOIN store.apps a ON a.developer_id = d.id
LEFT JOIN store.installations i ON i.app_id = a.id
LEFT JOIN store.subscriptions s ON s.installation_id = i.id
LEFT JOIN store.app_plans p ON p.id = s.plan_id
GROUP BY d.id, d.name, a.name, d.revenue_share_pct;

-- Tenant isolation on tenant-owned rows
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON installations USING (tenant_id = pos.current_tenant()) WITH CHECK (tenant_id = pos.current_tenant());
ALTER TABLE app_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_read_all ON app_ratings FOR SELECT USING (true);
CREATE POLICY tenant_write_own ON app_ratings FOR INSERT WITH CHECK (tenant_id = pos.current_tenant());
CREATE POLICY tenant_update_own ON app_ratings FOR UPDATE USING (tenant_id = pos.current_tenant());

GRANT USAGE ON SCHEMA store TO pos_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA store TO pos_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA store TO pos_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA store TO pos_app;
