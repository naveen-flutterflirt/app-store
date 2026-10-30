-- ==============================================================================
-- BizBox Platform Database Schema (PostgreSQL 16)
-- FlutterFlirt Private Limited · Version 1.0
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ------------------------------------------------------------------------------
-- Mock / Reference POS Schema (to satisfy foreign keys in shared database)
-- ------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS pos;

CREATE TABLE IF NOT EXISTS pos.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pos.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES pos.tenants(id) ON DELETE CASCADE,
    email CITEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pos.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES pos.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    device_type TEXT NOT NULL DEFAULT 'pi5_box',
    serial_number TEXT UNIQUE NOT NULL,
    device_token TEXT NOT NULL,
    is_online BOOLEAN NOT NULL DEFAULT false,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- STORE SCHEMA
-- ------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS store;

-- Enums
DO $$ BEGIN
    CREATE TYPE store.dev_type AS ENUM ('individual', 'company');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE store.app_category AS ENUM (
        'Sales & POS',
        'Kitchen',
        'Online orders',
        'Inventory',
        'Customers',
        'Marketing',
        'Finance & GST',
        'Staff',
        'Devices',
        'Industry',
        'Analytics',
        'AI'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE store.runtime_kind AS ENUM ('cloud', 'edge', 'hybrid');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE store.listing_status AS ENUM ('draft', 'in_review', 'published', 'delisted', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE store.price_unit AS ENUM ('outlet', 'device', 'month', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE store.release_channel AS ENUM ('alpha', 'beta', 'stable');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE store.version_status AS ENUM (
        'draft',
        'submitted',
        'checking',
        'in_review',
        'changes_requested',
        'rejected',
        'approved',
        'published',
        'withdrawn',
        'superseded'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE store.check_kind AS ENUM (
        'manifest',
        'sbom',
        'security',
        'licence',
        'arm64_boot',
        'permissions'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE store.check_status AS ENUM ('pending', 'running', 'passed', 'warned', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE store.review_decision AS ENUM ('approved', 'changes_requested', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE store.install_status AS ENUM ('installing', 'installed', 'suspended', 'uninstalled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE store.deploy_status AS ENUM ('pending', 'pulling', 'running', 'error', 'stopped');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE store.sub_status AS ENUM ('trialing', 'active', 'past_due', 'cancelled', 'halted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ------------------------------------------------------------------------------
-- 1. developers (11 columns)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store.developers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(40) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type store.dev_type NOT NULL DEFAULT 'company',
    email CITEXT NOT NULL,
    website TEXT,
    gstin VARCHAR(15),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    revenue_share_pct NUMERIC(5,2) NOT NULL DEFAULT 80.00,
    payout_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. developer_members (4 columns)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store.developer_members (
    developer_id UUID NOT NULL REFERENCES store.developers(id) ON DELETE CASCADE,
    email CITEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (developer_id, email)
);

-- ------------------------------------------------------------------------------
-- 3. apps (22 columns)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store.apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES store.developers(id) ON DELETE RESTRICT,
    slug VARCHAR(50) UNIQUE NOT NULL,
    package_id VARCHAR(80) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    tagline VARCHAR(90) NOT NULL,
    category store.app_category NOT NULL,
    business_types TEXT[] NOT NULL DEFAULT '{}',
    description_md TEXT NOT NULL,
    icon_url TEXT,
    screenshots TEXT[] NOT NULL DEFAULT '{}',
    support_email CITEXT,
    privacy_url TEXT,
    runtime store.runtime_kind NOT NULL DEFAULT 'cloud',
    status store.listing_status NOT NULL DEFAULT 'draft',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_core BOOLEAN NOT NULL DEFAULT FALSE,
    rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    rating_count INTEGER NOT NULL DEFAULT 0,
    install_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apps_category ON store.apps(category);
CREATE INDEX IF NOT EXISTS idx_apps_status ON store.apps(status);
CREATE INDEX IF NOT EXISTS idx_apps_name_trgm ON store.apps USING gin (name gin_trgm_ops);

-- ------------------------------------------------------------------------------
-- 4. oauth_clients (6 columns)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store.oauth_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID NOT NULL REFERENCES store.apps(id) ON DELETE CASCADE,
    client_id VARCHAR(40) UNIQUE NOT NULL,
    secret_hash TEXT NOT NULL,
    redirect_uris TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. app_dependencies (3 columns)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store.app_dependencies (
    app_id UUID NOT NULL REFERENCES store.apps(id) ON DELETE CASCADE,
    requires_app UUID NOT NULL REFERENCES store.apps(id) ON DELETE CASCADE,
    min_version VARCHAR(20) NOT NULL,
    PRIMARY KEY (app_id, requires_app)
);

-- ------------------------------------------------------------------------------
-- 6. app_plans (10 columns)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store.app_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID NOT NULL REFERENCES store.apps(id) ON DELETE CASCADE,
    code VARCHAR(30) NOT NULL,
    name TEXT NOT NULL,
    unit store.price_unit NOT NULL,
    price_month NUMERIC(10,2) NOT NULL,
    price_year NUMERIC(10,2),
    trial_days INTEGER NOT NULL DEFAULT 14,
    limits JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (app_id, code)
);

-- ------------------------------------------------------------------------------
-- 7. app_ratings (8 columns)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store.app_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID NOT NULL REFERENCES store.apps(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES pos.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES pos.users(id) ON DELETE SET NULL,
    stars SMALLINT NOT NULL CHECK (stars >= 1 AND stars <= 5),
    comment TEXT,
    dev_reply TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (app_id, tenant_id)
);

-- ------------------------------------------------------------------------------
-- 8. app_versions (18 columns)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store.app_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID NOT NULL REFERENCES store.apps(id) ON DELETE CASCADE,
    version VARCHAR(20) NOT NULL,
    channel store.release_channel NOT NULL DEFAULT 'stable',
    manifest JSONB NOT NULL,
    bundle_url TEXT NOT NULL,
    bundle_sha256 CHAR(64) NOT NULL,
    image_ref TEXT,
    signature TEXT,
    sbom_url TEXT,
    min_platform VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    release_notes TEXT NOT NULL,
    status store.version_status NOT NULL DEFAULT 'draft',
    rollout_pct SMALLINT NOT NULL DEFAULT 0 CHECK (rollout_pct >= 0 AND rollout_pct <= 100),
    submitted_by CITEXT,
    submitted_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (app_id, version)
);

-- ------------------------------------------------------------------------------
-- 9. version_scopes (4 columns)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store.version_scopes (
    version_id UUID NOT NULL REFERENCES store.app_versions(id) ON DELETE CASCADE,
    scope TEXT NOT NULL,
    reason TEXT NOT NULL,
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (version_id, scope)
);

-- ------------------------------------------------------------------------------
-- 10. version_checks (8 columns)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store.version_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES store.app_versions(id) ON DELETE CASCADE,
    kind store.check_kind NOT NULL,
    status store.check_status NOT NULL DEFAULT 'pending',
    summary TEXT,
    report JSONB,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    UNIQUE (version_id, kind)
);

-- ------------------------------------------------------------------------------
-- 11. version_reviews (7 columns)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store.version_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES store.app_versions(id) ON DELETE CASCADE,
    reviewer CITEXT NOT NULL,
    decision store.review_decision NOT NULL,
    notes TEXT NOT NULL,
    checklist JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 12. installations (14 columns)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store.installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES pos.tenants(id) ON DELETE CASCADE,
    app_id UUID NOT NULL REFERENCES store.apps(id) ON DELETE RESTRICT,
    version_id UUID NOT NULL REFERENCES store.app_versions(id) ON DELETE RESTRICT,
    plan_id UUID REFERENCES store.app_plans(id) ON DELETE SET NULL,
    status store.install_status NOT NULL DEFAULT 'installing',
    outlet_ids UUID[] NOT NULL DEFAULT '{}',
    granted_scopes TEXT[] NOT NULL DEFAULT '{}',
    config JSONB NOT NULL DEFAULT '{}',
    auto_update BOOLEAN NOT NULL DEFAULT TRUE,
    installed_by UUID REFERENCES pos.users(id) ON DELETE SET NULL,
    installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uninstalled_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rule: A business can have only one live installation of an app
CREATE UNIQUE INDEX IF NOT EXISTS one_live_install 
ON store.installations(tenant_id, app_id) 
WHERE status IN ('installing', 'installed');

-- ------------------------------------------------------------------------------
-- 13. edge_deployments (11 columns)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store.edge_deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    installation_id UUID NOT NULL REFERENCES store.installations(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES pos.devices(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES store.app_versions(id) ON DELETE RESTRICT,
    status store.deploy_status NOT NULL DEFAULT 'pending',
    container_id TEXT,
    cpu_pct NUMERIC(5,2),
    mem_mb INTEGER,
    error TEXT,
    last_heartbeat TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 14. subscriptions (9 columns)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    installation_id UUID NOT NULL REFERENCES store.installations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES store.app_plans(id) ON DELETE RESTRICT,
    status store.sub_status NOT NULL DEFAULT 'trialing',
    quantity INTEGER NOT NULL DEFAULT 1,
    current_period_end TIMESTAMPTZ NOT NULL,
    provider TEXT NOT NULL DEFAULT 'razorpay',
    provider_sub_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 15. webhook_subscriptions (6 columns)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store.webhook_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    installation_id UUID NOT NULL REFERENCES store.installations(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    target_url TEXT NOT NULL,
    secret_ref TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ------------------------------------------------------------------------------
-- 16. usage_daily (5 columns)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store.usage_daily (
    installation_id UUID NOT NULL REFERENCES store.installations(id) ON DELETE CASCADE,
    day DATE NOT NULL,
    api_calls INTEGER NOT NULL DEFAULT 0,
    active_users INTEGER NOT NULL DEFAULT 0,
    errors INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (installation_id, day)
);

-- ------------------------------------------------------------------------------
-- 17. payouts (10 columns)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store.payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES store.developers(id) ON DELETE RESTRICT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    gross NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tds NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    net NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'draft',
    provider_ref TEXT
);

-- ------------------------------------------------------------------------------
-- 18. store_audit (7 columns)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store.store_audit (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor CITEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    detail JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- Triggers, Business Logic Rules & Functions
-- ------------------------------------------------------------------------------

-- Rule: guard_publish()
-- Blocks status = 'published' unless all checks passed/warned, a reviewer approved and bundle is signed
CREATE OR REPLACE FUNCTION store.guard_publish()
RETURNS TRIGGER AS $$
DECLARE
    v_failed_checks INTEGER;
    v_approved INTEGER;
BEGIN
    IF NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published' THEN
        -- 1. Check CI Checks
        SELECT COUNT(*) INTO v_failed_checks
        FROM store.version_checks
        WHERE version_id = NEW.id AND status NOT IN ('passed', 'warned');

        IF v_failed_checks > 0 THEN
            RAISE EXCEPTION 'Cannot publish version %: automated CI checks have not all passed/warned.', NEW.version;
        END IF;

        -- 2. Check Human Reviewer Approval
        SELECT COUNT(*) INTO v_approved
        FROM store.version_reviews
        WHERE version_id = NEW.id AND decision = 'approved';

        IF v_approved = 0 THEN
            RAISE EXCEPTION 'Cannot publish version %: must have approval from reviewer in version_reviews.', NEW.version;
        END IF;

        -- 3. Check Cosign Signature
        IF NEW.signature IS NULL OR LENGTH(TRIM(NEW.signature)) = 0 THEN
            RAISE EXCEPTION 'Cannot publish version %: bundle is not cryptographically signed (missing signature).', NEW.version;
        END IF;

        -- Set published_at timestamp
        NEW.published_at := NOW();

        -- Record audit
        INSERT INTO store.store_audit(actor, action, entity, entity_id, detail)
        VALUES (
            COALESCE(NEW.submitted_by, 'system'),
            'publish_version',
            'app_versions',
            NEW.id,
            jsonb_build_object('version', NEW.version, 'app_id', NEW.app_id, 'rollout_pct', NEW.rollout_pct)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_publish ON store.app_versions;
CREATE TRIGGER trg_guard_publish
BEFORE UPDATE OF status ON store.app_versions
FOR EACH ROW
EXECUTE FUNCTION store.guard_publish();


-- Rule: Staged Rollout Bucket Calculator
-- Returns the version a business should get under staged rollout: hash(tenant) mod 100
CREATE OR REPLACE FUNCTION store.version_for_tenant(p_app_id UUID, p_tenant_id UUID)
RETURNS UUID AS $$
DECLARE
    v_tenant_bucket INTEGER;
    v_selected_version_id UUID;
BEGIN
    -- Hash the tenant uuid to an integer between 0 and 99
    v_tenant_bucket := ABS(('x' || SUBSTRING(MD5(p_tenant_id::TEXT), 1, 8))::BIT(32)::INTEGER) % 100;

    -- Pick the highest published version matching the bucket, or latest fully published version (rollout_pct = 100)
    SELECT id INTO v_selected_version_id
    FROM store.app_versions
    WHERE app_id = p_app_id
      AND status = 'published'
      AND (rollout_pct >= 100 OR v_tenant_bucket < rollout_pct)
    ORDER BY created_at DESC
    LIMIT 1;

    RETURN v_selected_version_id;
END;
$$ LANGUAGE plpgsql STABLE;


-- Triggers: Rating & Install Count Refresher
CREATE OR REPLACE FUNCTION store.refresh_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_target_app_id UUID;
BEGIN
    v_target_app_id := COALESCE(NEW.app_id, OLD.app_id);

    UPDATE store.apps
    SET rating_avg = COALESCE((SELECT ROUND(AVG(stars)::NUMERIC, 2) FROM store.app_ratings WHERE app_id = v_target_app_id), 0.00),
        rating_count = (SELECT COUNT(*) FROM store.app_ratings WHERE app_id = v_target_app_id),
        updated_at = NOW()
    WHERE id = v_target_app_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_rating ON store.app_ratings;
CREATE TRIGGER trg_refresh_rating
AFTER INSERT OR UPDATE OR DELETE ON store.app_ratings
FOR EACH ROW
EXECUTE FUNCTION store.refresh_rating();

CREATE OR REPLACE FUNCTION store.refresh_installs()
RETURNS TRIGGER AS $$
DECLARE
    v_target_app_id UUID;
BEGIN
    v_target_app_id := COALESCE(NEW.app_id, OLD.app_id);

    UPDATE store.apps
    SET install_count = (
        SELECT COUNT(*) 
        FROM store.installations 
        WHERE app_id = v_target_app_id 
          AND status IN ('installing', 'installed')
    ),
    updated_at = NOW()
    WHERE id = v_target_app_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_installs ON store.installations;
CREATE TRIGGER trg_refresh_installs
AFTER INSERT OR UPDATE OR DELETE ON store.installations
FOR EACH ROW
EXECUTE FUNCTION store.refresh_installs();

-- ------------------------------------------------------------------------------
-- Views: v_listing, v_review_queue, v_developer_mrr
-- ------------------------------------------------------------------------------

-- Store front listings view
CREATE OR REPLACE VIEW store.v_listing AS
SELECT 
    a.id,
    a.slug,
    a.package_id,
    a.name,
    a.tagline,
    a.category,
    a.business_types,
    a.icon_url,
    a.runtime,
    a.rating_avg,
    a.rating_count,
    a.install_count,
    a.is_featured,
    a.is_core,
    d.id AS developer_id,
    d.name AS developer_name,
    d.slug AS developer_slug,
    d.is_verified AS developer_verified,
    (
        SELECT jsonb_agg(jsonb_build_object(
            'id', p.id,
            'code', p.code,
            'name', p.name,
            'unit', p.unit,
            'price_month', p.price_month,
            'price_year', p.price_year,
            'trial_days', p.trial_days
        ))
        FROM store.app_plans p
        WHERE p.app_id = a.id AND p.is_active = TRUE
    ) AS plans
FROM store.apps a
JOIN store.developers d ON a.developer_id = d.id
WHERE a.status = 'published';

-- Review queue for internal FlutterFlirt reviewers
CREATE OR REPLACE VIEW store.v_review_queue AS
SELECT 
    v.id AS version_id,
    v.version,
    v.channel,
    v.submitted_at,
    v.submitted_by,
    v.min_platform,
    a.id AS app_id,
    a.name AS app_name,
    a.package_id,
    d.name AS developer_name,
    (
        SELECT jsonb_object_agg(vc.kind, vc.status)
        FROM store.version_checks vc
        WHERE vc.version_id = v.id
    ) AS check_summary,
    (
        SELECT jsonb_agg(jsonb_build_object('scope', vs.scope, 'reason', vs.reason, 'is_sensitive', vs.is_sensitive))
        FROM store.version_scopes vs
        WHERE vs.version_id = v.id
    ) AS scopes
FROM store.app_versions v
JOIN store.apps a ON v.app_id = a.id
JOIN store.developers d ON a.developer_id = d.id
WHERE v.status = 'in_review';

-- Monthly Recurring Revenue (MRR) view per developer
CREATE OR REPLACE VIEW store.v_developer_mrr AS
SELECT 
    d.id AS developer_id,
    d.name AS developer_name,
    d.revenue_share_pct,
    COUNT(DISTINCT i.id) AS active_installs,
    COALESCE(SUM(p.price_month), 0.00) AS total_gross_mrr,
    COALESCE(SUM(p.price_month) * (d.revenue_share_pct / 100.0), 0.00) AS developer_net_mrr,
    COALESCE(SUM(p.price_month) * ((100.0 - d.revenue_share_pct) / 100.0), 0.00) AS platform_net_mrr
FROM store.developers d
LEFT JOIN store.apps a ON a.developer_id = d.id
LEFT JOIN store.installations i ON i.app_id = a.id AND i.status = 'installed'
LEFT JOIN store.app_plans p ON i.plan_id = p.id
GROUP BY d.id, d.name, d.revenue_share_pct;

-- ------------------------------------------------------------------------------
-- Row-Level Security (RLS) Setup
-- ------------------------------------------------------------------------------
ALTER TABLE store.installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE store.app_ratings ENABLE ROW LEVEL SECURITY;

-- Installations visible only to their own business (tenant)
CREATE POLICY tenant_installations_isolation ON store.installations
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- Ratings readable by all, but writable only by the authenticated tenant
CREATE POLICY ratings_public_read ON store.app_ratings
    FOR SELECT USING (true);

CREATE POLICY ratings_tenant_write ON store.app_ratings
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
