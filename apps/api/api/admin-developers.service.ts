import { query } from '../src/db';

export class AdminDevelopersService {
  async listAllDevelopers() {
    const developers = await query(`
      SELECT 
        d.id,
        d.slug,
        d.name,
        d.type,
        d.email,
        d.website,
        d.is_verified,
        d.revenue_share_pct,
        d.created_at,
        COUNT(DISTINCT a.id)::int as total_apps,
        COUNT(DISTINCT CASE WHEN a.status = 'draft' THEN a.id END)::int as draft_apps,
        COUNT(DISTINCT CASE WHEN v.channel IN ('internal', 'beta') THEN a.id END)::int as testing_apps,
        COUNT(DISTINCT CASE WHEN a.status = 'listed' THEN a.id END)::int as live_apps,
        COALESCE(SUM(a.install_count), 0)::int as total_installs
      FROM store.developers d
      LEFT JOIN store.apps a ON a.developer_id = d.id
      LEFT JOIN store.app_versions v ON v.app_id = a.id
      GROUP BY d.id, d.slug, d.name, d.type, d.email, d.website, d.is_verified, d.revenue_share_pct, d.created_at
      ORDER BY d.created_at DESC
    `);

    // For each developer, get their apps list
    const devIds = developers.map((d: any) => d.id);
    let allApps: any[] = [];
    if (devIds.length > 0) {
      allApps = await query(`
        SELECT 
          a.id, a.developer_id, a.name, a.package_id, a.slug, a.category, a.status,
          COALESCE((SELECT v.version FROM store.app_versions v WHERE v.app_id = a.id ORDER BY v.created_at DESC LIMIT 1), '1.0.0') as last_version,
          COALESCE((SELECT v.rollout_pct FROM store.app_versions v WHERE v.app_id = a.id AND v.status = 'published' ORDER BY v.published_at DESC LIMIT 1), 0) as rollout_pct
        FROM store.apps a
        WHERE a.developer_id = ANY($1::uuid[])
        ORDER BY a.created_at DESC
      `, [devIds]);
    }

    const appsByDev: Record<string, any[]> = {};
    for (const app of allApps) {
      if (!appsByDev[app.developer_id]) appsByDev[app.developer_id] = [];
      appsByDev[app.developer_id].push(app);
    }

    return developers.map((d: any) => ({
      ...d,
      apps_list: appsByDev[d.id] || []
    }));
  }
}

export const adminDevelopersService = new AdminDevelopersService();
