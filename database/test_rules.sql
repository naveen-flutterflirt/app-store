-- ==============================================================================
-- Test Verification Script for guard_publish() and Business Logic Rules
-- ==============================================================================

DO $$
DECLARE
    v_app_id UUID := 'a0000000-0000-0000-0000-000000000022'; -- FoodCost Pro
    v_ver_id UUID := '99999999-9999-9999-9999-999999999999';
    v_blocked BOOLEAN := FALSE;
BEGIN
    -- 1. Insert a draft version for FoodCost Pro
    INSERT INTO store.app_versions (
        id, app_id, version, channel, manifest, bundle_url, bundle_sha256,
        status, rollout_pct, submitted_by, release_notes
    ) VALUES (
        v_ver_id, v_app_id, '1.1.0', 'stable', '{"runtime":"cloud"}'::JSONB,
        'https://s3.bizbox.in/bundles/foodcost-1.1.0.tar.gz',
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        'in_review', 10, 'dev@kitchenmetrics.io', 'Added menu matrix calculations'
    ) ON CONFLICT (id) DO NOTHING;

    -- 2. Try to directly publish WITHOUT passed checks -> MUST FAIL
    BEGIN
        UPDATE store.app_versions SET status = 'published' WHERE id = v_ver_id;
    EXCEPTION WHEN OTHERS THEN
        v_blocked := TRUE;
        RAISE NOTICE 'SUCCESS: guard_publish() correctly blocked unauthorized publishing without checks!';
    END;

    IF NOT v_blocked THEN
        RAISE EXCEPTION 'TEST FAILED: Version was published without checks passing!';
    END IF;

    -- 3. Now simulate passing all checks
    INSERT INTO store.version_checks (version_id, kind, status, summary)
    VALUES 
        (v_ver_id, 'manifest', 'passed', 'Manifest schema valid'),
        (v_ver_id, 'sbom', 'passed', 'Syft SBOM generated'),
        (v_ver_id, 'security', 'passed', 'Trivy: 0 CVEs found'),
        (v_ver_id, 'licence', 'passed', 'Closed-source compatible'),
        (v_ver_id, 'arm64_boot', 'passed', 'Boot test passed on Pi 5'),
        (v_ver_id, 'permissions', 'passed', 'Scopes justified')
    ON CONFLICT (version_id, kind) DO UPDATE SET status = 'passed';

    -- 4. Add reviewer approval
    INSERT INTO store.version_reviews (version_id, reviewer, decision, notes)
    VALUES (v_ver_id, 'reviewer@flutterflirt.com', 'approved', 'Manifest and scopes verified manually.');

    -- 5. Add cosign signature
    UPDATE store.app_versions 
    SET signature = 'MEQCID7xY2e...cosign-signature-payload...'
    WHERE id = v_ver_id;

    -- 6. Now publish -> MUST SUCCEED
    UPDATE store.app_versions SET status = 'published' WHERE id = v_ver_id;
    RAISE NOTICE 'SUCCESS: Version 1.1.0 published successfully after checks, review, and signing!';

    -- 7. Test Tenant Rollout
    PERFORM store.version_for_tenant(v_app_id, '00000000-0000-0000-0000-000000000001');
    RAISE NOTICE 'SUCCESS: Staged rollout algorithm successfully resolved tenant version!';
END $$;

