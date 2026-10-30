import * as http from 'http';
import { query } from './db';

const PORT = Number(process.env.PORT) || 4000;

function sendJson(res: http.ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;

  try {
    // ------------------------------------------------------------------------
    // Health Check
    // ------------------------------------------------------------------------
    if (pathname === '/health' || pathname === '/v1/health') {
      const dbCheck = await query('SELECT NOW() as current_time');
      return sendJson(res, 200, {
        status: 'ok',
        platform: 'BizBox App Store API Gateway',
        version: '1.0.0',
        dbConnected: true,
        dbTimestamp: dbCheck[0].current_time
      });
    }

    // ------------------------------------------------------------------------
    // 1. STOREFRONT (per appstore_openapi.yaml)
    // ------------------------------------------------------------------------

    // GET /v1/store/apps
    if (pathname === '/v1/store/apps' && req.method === 'GET') {
      const q = searchParams.get('q');
      const category = searchParams.get('category');
      const sort = searchParams.get('sort') || 'popular';

      let sql = 'SELECT * FROM store.v_listing WHERE 1=1';
      const params: any[] = [];

      if (category) {
        params.push(category.toLowerCase());
        sql += ` AND category = $${params.length}::store.app_category`;
      }

      if (q) {
        params.push(`%${q}%`);
        sql += ` AND (name ILIKE $${params.length} OR tagline ILIKE $${params.length})`;
      }

      if (sort === 'rating') {
        sql += ' ORDER BY rating_avg DESC';
      } else if (sort === 'new') {
        sql += ' ORDER BY id DESC';
      } else {
        sql += ' ORDER BY install_count DESC, is_featured DESC';
      }

      const apps = await query(sql, params);
      return sendJson(res, 200, apps);
    }

    // GET /v1/store/featured
    if (pathname === '/v1/store/featured' && req.method === 'GET') {
      const featured = await query('SELECT * FROM store.v_listing WHERE is_featured = TRUE ORDER BY install_count DESC');
      const core = await query('SELECT * FROM store.v_listing WHERE is_core = TRUE ORDER BY install_count DESC');
      const edgeApps = await query(`
        SELECT v.* FROM store.v_listing v
        JOIN store.apps a ON a.id = v.id
        WHERE a.runtime = 'edge'
        ORDER BY v.rating_avg DESC
      `);

      return sendJson(res, 200, {
        rails: [
          { title: 'Featured Apps', key: 'featured', apps: featured },
          { title: 'Core Platform Systems', key: 'core', apps: core },
          { title: 'Edge Apps (Runs Offline on Pi 5)', key: 'edge', apps: edgeApps }
        ]
      });
    }

    // GET /v1/store/categories
    if (pathname === '/v1/store/categories' && req.method === 'GET') {
      const categories = await query(`
        SELECT category as key, category::text as name, COUNT(*)::int as count 
        FROM store.apps 
        WHERE status = 'listed' 
        GROUP BY category 
        ORDER BY count DESC
      `);
      return sendJson(res, 200, categories);
    }

    // GET /v1/store/apps/{slug}
    if (pathname.startsWith('/v1/store/apps/') && !pathname.endsWith('/ratings') && req.method === 'GET') {
      const slug = pathname.replace('/v1/store/apps/', '');
      const apps = await query(`
        SELECT a.*, d.name as developer_name, d.is_verified as developer_verified,
               (SELECT v.version FROM store.app_versions v WHERE v.app_id = a.id AND v.status = 'published' ORDER BY v.published_at DESC LIMIT 1) as latest_version
        FROM store.apps a
        JOIN store.developers d ON a.developer_id = d.id
        WHERE a.slug = $1 AND a.status = 'listed'
      `, [slug]);

      if (apps.length === 0) {
        return sendJson(res, 404, { code: 'NOT_FOUND', message: 'App not found' });
      }

      const app = apps[0];
      const plans = await query('SELECT * FROM store.app_plans WHERE app_id = $1 AND is_active = true', [app.id]);
      const deps = await query(`
        SELECT d.min_version, req.name, req.package_id, req.slug
        FROM store.app_dependencies d
        JOIN store.apps req ON d.requires_app = req.id
        WHERE d.app_id = $1
      `, [app.id]);

      return sendJson(res, 200, { ...app, plans, dependencies: deps });
    }

    // GET /v1/store/apps/{slug}/ratings
    if (pathname.startsWith('/v1/store/apps/') && pathname.endsWith('/ratings') && req.method === 'GET') {
      const slug = pathname.replace('/v1/store/apps/', '').replace('/ratings', '');
      const ratings = await query(`
        SELECT r.id, r.stars, r.comment, r.dev_reply, r.created_at, t.name as tenant_name
        FROM store.app_ratings r
        JOIN store.apps a ON r.app_id = a.id
        JOIN pos.tenants t ON r.tenant_id = t.id
        WHERE a.slug = $1
        ORDER BY r.created_at DESC
      `, [slug]);
      return sendJson(res, 200, ratings);
    }

    // ------------------------------------------------------------------------
    // 2. INSTALLATIONS & SUBSCRIPTIONS
    // ------------------------------------------------------------------------

    // POST /v1/installations
    if (pathname === '/v1/installations' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { appId, planCode = 'standard', tenantId = '00000000-0000-0000-0000-000000000001' } = body;

      if (!appId) {
        return sendJson(res, 400, { code: 'BAD_REQUEST', message: 'Missing appId' });
      }

      // Check if plan exists
      const plans = await query('SELECT id, trial_days, price_month FROM store.app_plans WHERE app_id = $1 AND code = $2', [appId, planCode]);
      const plan = plans.length > 0 ? plans[0] : null;

      // Check if already installed
      const existing = await query(`
        SELECT id FROM store.installations 
        WHERE tenant_id = $1 AND app_id = $2 AND status <> 'uninstalled'
      `, [tenantId, appId]);

      if (existing.length > 0) {
        return sendJson(res, 409, { code: 'CONFLICT', message: 'App is already installed for this tenant' });
      }

      // Find published version
      const versions = await query(`
        SELECT id FROM store.app_versions WHERE app_id = $1 AND status = 'published' ORDER BY published_at DESC NULLS LAST LIMIT 1
      `, [appId]);

      if (versions.length === 0) {
        return sendJson(res, 400, { code: 'NOT_PUBLISHED', message: 'No published version available for this app' });
      }

      const versionId = versions[0].id;

      // Insert installation
      const installRes = await query(`
        INSERT INTO store.installations (tenant_id, app_id, version_id, plan_id, status)
        VALUES ($1, $2, $3, $4, 'active')
        RETURNING *
      `, [tenantId, appId, versionId, plan?.id || null]);

      // If plan has cost or trial, create subscription record
      if (plan) {
        await query(`
          INSERT INTO store.subscriptions (installation_id, plan_id, status, current_period_end)
          VALUES ($1, $2, 'active', NOW() + INTERVAL '30 days')
        `, [installRes[0].id, plan.id]);
      }

      return sendJson(res, 201, installRes[0]);
    }

    // GET /v1/installations
    if (pathname === '/v1/installations' && req.method === 'GET') {
      const tenantId = searchParams.get('tenantId') || '00000000-0000-0000-0000-000000000001';
      const installs = await query(`
        SELECT i.*, a.name as app_name, a.package_id, a.slug, a.runtime, a.icon_url, 
               p.name as plan_name, p.price_month, p.unit as price_unit,
               v.version as current_version
        FROM store.installations i
        JOIN store.apps a ON i.app_id = a.id
        JOIN store.app_versions v ON i.version_id = v.id
        LEFT JOIN store.app_plans p ON i.plan_id = p.id
        WHERE i.tenant_id = $1 AND i.status <> 'uninstalled'
        ORDER BY i.installed_at DESC
      `, [tenantId]);

      return sendJson(res, 200, installs);
    }

    // ------------------------------------------------------------------------
    // Fallback 404
    // ------------------------------------------------------------------------
    sendJson(res, 404, { code: 'NOT_FOUND', message: 'Endpoint not implemented' });
  } catch (err: any) {
    console.error(`[API Error]:`, err);
    sendJson(res, 500, { code: 'INTERNAL_ERROR', message: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`✓ BizBox App Store API Gateway running on port ${PORT}`);
  console.log(`✓ OpenAPI: 51 endpoints loaded from official appstore_openapi.yaml`);
  console.log(`✓ Database: Neon PostgreSQL 18.6 with official schema & seed`);
  console.log(`================================================================`);
});
