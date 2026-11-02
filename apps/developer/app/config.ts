export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1'
).replace(/\/$/, '').replace(/\/v1$/, '') + '/v1';

export const STORE_URL = (
  process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3000'
).replace(/\/$/, '');

export const CONSOLE_URL = (
  process.env.NEXT_PUBLIC_CONSOLE_URL || 'http://localhost:3001'
).replace(/\/$/, '');

export const DEV_URL = (
  process.env.NEXT_PUBLIC_DEV_URL || 'http://localhost:3002'
).replace(/\/$/, '');

export const ADMIN_URL = (
  process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3003'
).replace(/\/$/, '');

