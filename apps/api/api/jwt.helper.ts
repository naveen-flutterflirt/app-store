import * as crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'bizbox_jwt_secret_2026';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  tenant_id?: string;
  developer_id?: string;
  company_name?: string;
  iat: number;
  exp: number;
}

export function signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresInSeconds: number = 86400 * 7): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;
  const fullPayload: JwtPayload = { ...payload, iat, exp };

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');

  return `${header}.${body}.${signature}`;
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    if (!token) return null;
    const parts = token.replace(/^Bearer\s+/i, '').trim().split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');

    if (signature !== expectedSig) {
      return null;
    }

    const payload: JwtPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}
