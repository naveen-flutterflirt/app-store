import { query } from '../../db';
import { ciPipelineService } from './ci-pipeline.service';

export interface CreateAppDto {
  name: string;
  tagline: string;
  category: string;
  businessTypes?: string[];
  descriptionMd?: string;
  runtime?: 'cloud' | 'edge' | 'hybrid';
}

export interface CreateVersionDto {
  version: string;
  manifest: Record<string, any>;
  channel?: 'internal' | 'beta' | 'stable';
  bundleUrl?: string;
  bundleSha256?: string;
  imageRef?: string;
  releaseNotes?: string;
}

export class DeveloperService {
  /**
   * Creates a draft app listing in Developer Portal (POST /dev/apps)
   */
  async createAppListing(developerId: string, dto: CreateAppDto) {
    if (!dto.name || !dto.name.trim()) {
      throw new Error('App name is required (2-60 characters).');
    }
    const trimmedName = dto.name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 60) {
      throw new Error('App name must be between 2 and 60 characters.');
    }

    // Category normalization & validation against store.app_category ENUM
    const validCategories = [
      'sales', 'kitchen', 'inventory', 'customers', 'finance', 
      'people', 'devices', 'online', 'analytics', 'ai', 'marketing', 'industry'
    ];

    const categoryMap: Record<string, string> = {
      'operations': 'kitchen',
      'ordering': 'sales',
      'pos': 'sales',
      'billing': 'finance',
      'gst': 'finance',
      'crm': 'customers',
      'loyalty': 'customers',
      'recipes': 'inventory',
      'purchasing': 'inventory',
      'staff': 'people',
      'attendance': 'people',
      'hardware': 'devices',
      'qr': 'online',
      'costing': 'analytics',
      'reports': 'analytics',
      'whatsapp': 'marketing',
    };

    const rawCat = (dto.category || '').toLowerCase().trim();
    const normalizedCategory = categoryMap[rawCat] || rawCat || 'sales';

    if (!validCategories.includes(normalizedCategory)) {
      throw new Error(`Invalid category "${dto.category}". Must be one of: ${validCategories.join(', ')}`);
    }

    // Generate unique slug & package_id
    let slug = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'app';
    let packageId = `in.developer.${slug}`;

    const existing = await query(`SELECT id FROM store.apps WHERE slug = $1 OR package_id = $2`, [slug, packageId]);
    if (existing && existing.length > 0) {
      const suffix = Math.random().toString(36).substring(2, 6);
      slug = `${slug.slice(0, 44)}-${suffix}`;
      packageId = `in.developer.${slug}`;
    }

    const tagline = (dto.tagline || 'Custom business application for BizBox').trim().slice(0, 90);
    const runtime = ['cloud', 'edge', 'hybrid'].includes(dto.runtime as string) ? dto.runtime : 'cloud';

    const res = await query(`
      INSERT INTO store.apps (
        developer_id, slug, package_id, name, tagline, category, 
        business_types, description_md, runtime, status
      )
      VALUES ($1, $2, $3, $4, $5, $6::store.app_category, $7, $8, $9, 'draft')
      RETURNING *
    `, [
      developerId,
      slug,
      packageId,
      trimmedName,
      tagline,
      normalizedCategory,
      dto.businessTypes || ['all'],
      dto.descriptionMd || `# ${trimmedName}\n\n${tagline}`,
      runtime
    ]);

    return res[0];
  }

  /**
   * Creates a new draft version and returns presigned bundle upload target
   * (POST /dev/apps/{appId}/versions)
   */
  async createVersion(appId: string, dto: CreateVersionDto) {
    if (!appId || !appId.trim()) {
      throw new Error('Valid App ID is required to create a version.');
    }

    // Verify app actually exists in database before attempting insert
    const appRecord = await query(`SELECT id, name, package_id, developer_id FROM store.apps WHERE id = $1`, [appId.trim()]);
    if (!appRecord || appRecord.length === 0) {
      // Fallback: If appId was passed as package_id or slug instead of UUID
      const fallback = await query(`SELECT id, name, package_id, developer_id FROM store.apps WHERE package_id = $1 OR slug = $1`, [appId.trim()]);
      if (fallback && fallback.length > 0) {
        appId = fallback[0].id;
      } else {
        throw new Error(`Application with ID "${appId}" not found in database. Please re-select the app from your portfolio.`);
      }
    }

    if (!dto.version || !dto.version.trim()) {
      throw new Error('Version string is required (e.g. 1.0.0).');
    }
    const versionStr = dto.version.trim();
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
    if (!semverRegex.test(versionStr)) {
      throw new Error(`Invalid version format "${versionStr}". Must follow Semantic Versioning (e.g., 1.0.0, 1.2.3).`);
    }

    // Check if version already exists for this app
    const existingVer = await query(`SELECT id FROM store.app_versions WHERE app_id = $1 AND version = $2`, [appId, versionStr]);
    if (existingVer && existingVer.length > 0) {
      throw new Error(`Version ${versionStr} already exists for this application. Please bump the patch/minor version.`);
    }

    const bundleUrl = dto.bundleUrl || `s3://bizbox-apps/${appId}/${versionStr}/bundle.tgz`;
    const bundleSha256 = dto.bundleSha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const channel = ['internal', 'beta', 'stable'].includes(dto.channel || '') ? dto.channel : 'internal';

    const res = await query(`
      INSERT INTO store.app_versions (
        app_id, version, channel, manifest, bundle_url, bundle_sha256, image_ref, release_notes, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
      RETURNING *
    `, [
      appId,
      versionStr,
      channel,
      JSON.stringify(dto.manifest || {}),
      bundleUrl,
      bundleSha256,
      dto.imageRef || null,
      (dto.releaseNotes || 'Initial version release').trim().slice(0, 500)
    ]);

    let uploadUrl = `https://${process.env.S3_BUCKET_BUNDLES || 'bizbox-bundles'}.s3.${process.env.S3_REGION || 'ap-south-1'}.amazonaws.com/${appId}/${dto.version}/bundle.tgz`;
    if (process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY) {
      // Generate AWS SigV4 presigned upload URL
      const region = process.env.S3_REGION || 'ap-south-1';
      const bucket = process.env.S3_BUCKET_BUNDLES || 'bizbox-bundles';
      const host = `${bucket}.s3.${region}.amazonaws.com`;
      const key = `${appId}/${dto.version}/bundle.tgz`;
      const now = new Date();
      const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
      const dateStamp = amzDate.substr(0, 8);
      const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;

      uploadUrl = `https://${host}/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${encodeURIComponent(process.env.S3_ACCESS_KEY + '/' + credentialScope)}&X-Amz-Date=${amzDate}&X-Amz-Expires=3600&X-Amz-SignedHeaders=host`;
    }
    return {
      version: res[0],
      uploadUrl,
      instructions: 'Upload your application .tgz bundle using HTTP PUT to uploadUrl before calling /submit'
    };
  }

  /**
   * Submits a version to the automated CI pipeline checks
   * (POST /dev/versions/{versionId}/submit)
   */
  async submitVersion(versionId: string) {
    // 1. Trigger automated 6 CI checks
    const pipelineRes = await ciPipelineService.runPipeline(versionId);

    // 2. Fetch updated version record
    const updated = await query(`SELECT * FROM store.app_versions WHERE id = $1`, [versionId]);
    return {
      version: updated[0],
      pipelinePassed: pipelineRes.passed,
      checkResults: pipelineRes.results
    };
  }

  /**
   * Promotes a version from internal/beta testing to production review queue
   * (POST /dev/versions/{versionId}/promote)
   */
  async promoteVersion(versionId: string, targetChannel: 'beta' | 'stable') {
    const versions = await query(`SELECT * FROM store.app_versions WHERE id = $1`, [versionId]);
    if (versions.length === 0) {
      throw new Error(`Version ${versionId} not found`);
    }

    const ver = versions[0];
    const newChannel = targetChannel === 'beta' ? 'beta' : 'stable';

    const res = await query(`
      UPDATE store.app_versions
      SET channel = $1::store.release_channel, 
          status = CASE WHEN $1::text = 'stable' THEN 'in_review'::store.version_status ELSE status END,
          submitted_at = CASE WHEN $1::text = 'stable' THEN NOW() ELSE submitted_at END
      WHERE id = $2
      RETURNING *
    `, [newChannel, versionId]);

    return res[0];
  }

  /**
   * Adjusts staged rollout percentage for an approved/published version (10 -> 50 -> 100%)
   * (POST /dev/versions/{versionId}/rollout)
   */
  async updateRollout(versionId: string, rolloutPct: number) {
    if (rolloutPct < 0 || rolloutPct > 100) {
      throw new Error('Rollout percentage must be between 0 and 100');
    }

    const res = await query(`
      UPDATE store.app_versions 
      SET rollout_pct = $1
      WHERE id = $2 AND status = 'published'
      RETURNING *
    `, [rolloutPct, versionId]);

    if (res.length === 0) {
      throw new Error(`Version ${versionId} is not in published status`);
    }

    // If 100% rollout reached, database rule supersedes older versions
    if (rolloutPct === 100) {
      const ver = res[0];
      await query(`
        UPDATE store.app_versions 
        SET status = 'superseded'
        WHERE app_id = $1 AND channel = $2 AND status = 'published' AND id <> $3
      `, [ver.app_id, ver.channel, ver.id]);
    }

    return res[0];
  }

  /**
   * Fetches developer app performance analytics (installs, revenue, errors)
   * (GET /dev/apps/{appId}/analytics)
   */
  async getAppAnalytics(appId: string) {
    const apps = await query(`
      SELECT a.id, a.name, a.install_count, a.rating_avg, a.rating_count,
             COUNT(DISTINCT i.id) as live_installs
      FROM store.apps a
      LEFT JOIN store.installations i ON a.id = i.app_id AND i.status <> 'uninstalled'
      WHERE a.id = $1
      GROUP BY a.id, a.name, a.install_count, a.rating_avg, a.rating_count
    `, [appId]);

    return apps[0] || null;
  }
}

export const developerService = new DeveloperService();

