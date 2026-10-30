import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load root or local .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[DB] Warning: DATABASE_URL not set.');
}

export const dbPool = new Pool({
  connectionString,
  ssl: connectionString?.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const client = await dbPool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows;
  } finally {
    client.release();
  }
}
