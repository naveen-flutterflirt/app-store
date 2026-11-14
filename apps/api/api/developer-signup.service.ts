import { query } from '../src/db';
import { signJwt } from './jwt.helper';
import * as crypto from 'crypto';

export interface DeveloperSignupDto {
  name: string;
  companyName: string;
  email: string;
  password: string;
  website?: string;
}

export class DeveloperSignupService {
  async signup(dto: DeveloperSignupDto) {
    const { name, companyName, email, password, website } = dto;

    if (!name || !name.trim()) throw new Error('Developer name is required');
    if (!companyName || !companyName.trim()) throw new Error('Company/Organization name is required');
    if (!email || !email.trim()) throw new Error('Valid email address is required');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters');

    const cleanEmail = email.trim().toLowerCase();
    const cleanCompany = companyName.trim();
    const cleanName = name.trim();

    // Check if user already exists
    const existingUsers = await query(`SELECT id FROM pos.users WHERE email = $1`, [cleanEmail]);
    if (existingUsers && existingUsers.length > 0) {
      throw new Error(`An account with email ${cleanEmail} is already registered. Please sign in.`);
    }

    // Generate slug for developer organization
    let slug = cleanCompany.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'developer';
    const existingDev = await query(`SELECT id FROM store.developers WHERE slug = $1`, [slug]);
    if (existingDev && existingDev.length > 0) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // 1. Create developer organization record in store.developers
    const devInsert = await query(`
      INSERT INTO store.developers (
        slug, name, type, email, website, is_verified, revenue_share_pct
      )
      VALUES ($1, $2, 'partner', $3, $4, true, 80.00)
      RETURNING *
    `, [
      slug,
      cleanCompany,
      cleanEmail,
      website?.trim() || `https://${slug}.dev`
    ]);
    const developer = devInsert[0];

    // 2. Hash password with sha256 + salt
    const salt = "bizbox_salt_2026";
    const passwordHash = crypto.createHash("sha256").update(password + salt).digest("hex");

    // 3. Create or reuse tenant for sandbox edge testing (use standard sandbox tenant or gen_random_uuid)
    const sandboxTenant = await query(`SELECT id FROM pos.tenants LIMIT 1`);
    const tenantId = sandboxTenant.length > 0 ? sandboxTenant[0].id : '00000000-0000-0000-0000-000000000001';

    // 4. Create user in pos.users
    const userInsert = await query(`
      INSERT INTO pos.users (
        tenant_id, email, name, role, password_hash
      )
      VALUES ($1, $2, $3, 'developer', $4)
      RETURNING id, email, name, role, tenant_id
    `, [
      tenantId,
      cleanEmail,
      cleanName,
      passwordHash
    ]);
    const user = userInsert[0];

    // 5. Link user in store.developer_members
    await query(`
      INSERT INTO store.developer_members (developer_id, email, role)
      VALUES ($1, $2, 'owner')
      ON CONFLICT DO NOTHING
    `, [developer.id, cleanEmail]);

    // 6. Issue RFC 7519 HMAC-SHA256 JWT Token with developer_id bound claim
    const token = signJwt({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: 'developer',
      tenant_id: user.tenant_id,
      developer_id: developer.id,
      company_name: developer.name
    });

    return {
      token,
      token_type: 'Bearer',
      expires_in: 86400 * 7,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      developer: {
        id: developer.id,
        slug: developer.slug,
        name: developer.name,
        email: developer.email,
        revenue_share_pct: developer.revenue_share_pct
      }
    };
  }
}

export const developerSignupService = new DeveloperSignupService();
