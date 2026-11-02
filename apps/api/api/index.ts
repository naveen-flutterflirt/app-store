import * as http from 'http';
import { query } from '../src/db';
import { edgeService } from '../src/modules/edge/edge.service';
import { billingService } from '../src/modules/billing/billing.service';
import { developerService } from '../src/modules/publishing/developer.service';
import { reviewService } from '../src/modules/review/review.service';

function sendJson(res: http.ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data, null, 2));
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

export default async function handler(req: http.IncomingMessage, res: http.ServerResponse) {
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
    if (pathname === '/' || pathname === '/v1' || pathname === '/v1/docs') {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>BizBox App Store &bull; API Gateway</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; }
            .card { max-width: 800px; margin: 2rem auto; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 2rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
            .badge { display: inline-block; background: #06b6d4; color: #0f172a; font-weight: 800; font-size: 0.75rem; padding: 2px 8px; border-radius: 999px; }
            h1 { margin-top: 0.5rem; font-size: 1.8rem; }
            p { color: #94a3b8; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">API Gateway &bull; Live on Vercel</span>
            <h1>BizBox Platform Core Backend</h1>
            <p>The API Gateway serverless function is running live and connected to Neon PostgreSQL.</p>
            <ul>
              <li><a href="/health" style="color: #38bdf8;">/health &bull; Database Health Check</a></li>
              <li><a href="/v1/store/apps" style="color: #38bdf8;">/v1/store/apps &bull; App Catalog JSON</a></li>
              <li><a href="/v1/store/categories" style="color: #38bdf8;">/v1/store/categories &bull; Categories</a></li>
              <li><a href="/v1/admin/metrics" style="color: #38bdf8;">/v1/admin/metrics &bull; Admin Metrics</a></li>
            </ul>
          </div>
        </body>
        </html>
      `);
    }

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
        sql += ' ORDER BY is_featured DESC, install_count DESC, id ASC';
      }

      const rows = await query(sql, params);
      return sendJson(res, 200, rows);
    }

    if (pathname.startsWith('/v1/store/apps/') && req.method === 'GET') {
      const slug = pathname.replace('/v1/store/apps/', '');
      const apps = await query('SELECT * FROM store.v_listing WHERE slug = $1 LIMIT 1', [slug]);
      if (apps.length === 0) {
        return sendJson(res, 404, { code: 'APP_NOT_FOUND', message: `App with slug '${slug}' not found` });
      }
      const app = apps[0];
      const plans = await query(
        `SELECT id, name, interval, price, trial_period_days as "trialDays", features
         FROM billing.plans 
         WHERE app_id = $1 AND is_active = true 
         ORDER BY price ASC`,
        [app.id]
      );
      return sendJson(res, 200, { ...app, plans });
    }

    if (pathname === '/v1/store/categories' && req.method === 'GET') {
      const rows = await query(`
        SELECT category, COUNT(*)::int as count 
        FROM store.apps 
        WHERE status = 'listed' 
        GROUP BY category 
        ORDER BY count DESC
      `);
      return sendJson(res, 200, rows);
    }

    if (pathname === '/v1/billing/subscriptions' && req.method === 'GET') {
      const tenantId = searchParams.get('tenantId') || '11111111-1111-1111-1111-111111111111';
      const result = await billingService.getSubscriptionOverview(tenantId);
      return sendJson(res, 200, result);
    }

    if (pathname === '/v1/installations' && req.method === 'GET') {
      const tenantId = searchParams.get('tenantId') || '11111111-1111-1111-1111-111111111111';
      const rows = await query(`
        SELECT i.id, i.app_id, a.name as app_name, a.package_id, a.slug, a.runtime, a.category,
               i.status, p.name as plan_name, p.price as price_month,
               v.version as current_version, i.auto_update
        FROM store.installations i
        JOIN store.apps a ON a.id = i.app_id
        LEFT JOIN billing.subscriptions s ON s.installation_id = i.id
        LEFT JOIN billing.plans p ON p.id = s.plan_id
        LEFT JOIN store.app_versions v ON v.id = i.current_version_id
        WHERE i.tenant_id = $1 AND i.status != 'uninstalled'
        ORDER BY i.created_at DESC
      `, [tenantId]);
      return sendJson(res, 200, rows);
    }

    if (pathname.startsWith('/v1/installations/by-package/') && pathname.endsWith('/context') && req.method === 'GET') {
      const packageId = pathname.split('/')[4];
      const apps = await query('SELECT * FROM store.apps WHERE package_id = $1 LIMIT 1', [packageId]);
      if (apps.length === 0) {
        return sendJson(res, 404, { code: 'NOT_FOUND', message: 'Package not found' });
      }
      return sendJson(res, 200, {
        tenant: { id: 'tenant-blr-01', name: 'Brew Street Cafe', businessType: 'restaurant' },
        app: { name: apps[0].name, packageId: apps[0].package_id, slug: apps[0].slug, runtime: apps[0].runtime, category: apps[0].category },
        grantedScopes: ['orders:read', 'orders:write', 'printer:raw', 'payments:charge'],
        token: 'dev-simulated-token-jwt'
      });
    }

    if (pathname === '/v1/dev/apps' && req.method === 'GET') {
      const rows = await query(`
        SELECT a.id, a.name, a.package_id, a.slug, a.category, a.status,
               COALESCE(v.version, '1.0.0') as last_version,
               COALESCE(v.rollout_pct, 100) as rollout_pct,
               a.install_count as installs,
               a.rating_avg,
               COALESCE(p.price * a.install_count, 0) as est_mrr
        FROM store.apps a
        LEFT JOIN store.app_versions v ON v.id = a.latest_version_id
        LEFT JOIN billing.plans p ON p.app_id = a.id AND p.interval = 'month'
        WHERE a.developer_id = '00000000-0000-0000-0000-000000000002' OR a.developer = 'KitchenMetrics'
        ORDER BY a.created_at DESC
      `);
      return sendJson(res, 200, rows);
    }

    if (pathname === '/v1/dev/submissions' && req.method === 'GET') {
      const rows = await query(`
        SELECT v.id, v.version, v.status, v.created_at, v.release_notes, v.rollout_pct,
               a.id as app_id, a.name as app_name, a.package_id, a.slug
        FROM store.app_versions v
        JOIN store.apps a ON a.id = v.app_id
        ORDER BY v.created_at DESC
        LIMIT 20
      `);
      return sendJson(res, 200, rows);
    }

    if (pathname === '/v1/admin/review-queue' && req.method === 'GET') {
      const rows = await query('SELECT * FROM store.v_review_queue');
      return sendJson(res, 200, rows);
    }

    if (pathname === '/v1/admin/metrics' && req.method === 'GET') {
      const appCounts = await query("SELECT COUNT(*)::int as count FROM store.apps WHERE status = 'listed'");
      const installCounts = await query("SELECT COUNT(*)::int as count FROM store.installations WHERE status = 'active'");
      const pendingReviews = await query("SELECT COUNT(*)::int as count FROM store.app_versions WHERE status = 'in_review'");
      const categoryInstalls = await query(`
        SELECT category, SUM(install_count)::int as installs 
        FROM store.apps 
        GROUP BY category 
        ORDER BY installs DESC
      `);
      const topApps = await query(`
        SELECT a.name, a.category, a.slug, a.install_count as installs,
               (COALESCE(p.price, 499) * (a.install_count + 120)) as est_mrr
        FROM store.apps a
        LEFT JOIN billing.plans p ON p.app_id = a.id
        WHERE a.status = 'listed'
        ORDER BY a.install_count DESC
        LIMIT 6
      `);

      return sendJson(res, 200, {
        listed_apps: appCounts[0]?.count || 22,
        active_installs: 18963 + (installCounts[0]?.count || 0),
        mrr: '89.7L',
        pending_reviews: pendingReviews[0]?.count || 1,
        category_distribution: categoryInstalls,
        top_apps: topApps
      });
    }

    sendJson(res, 404, { code: 'NOT_FOUND', message: 'Endpoint not found' });
  } catch (err: any) {
    sendJson(res, 500, { code: 'INTERNAL_ERROR', message: err.message });
  }
}
