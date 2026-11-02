export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1'
).replace(/\/$/, '').replace(/\/v1$/, '') + '/v1';

export const STORE_URL = (
  process.env.NEXT_PUBLIC_STORE_URL || 'https://app-store-taupe-two.vercel.app'
).replace(/\/$/, '');

export const CONSOLE_URL = (
  process.env.NEXT_PUBLIC_CONSOLE_URL || 'https://app-store-742z.vercel.app'
).replace(/\/$/, '');

export const DEV_URL = (
  process.env.NEXT_PUBLIC_DEV_URL || 'https://app-store-ubpt.vercel.app'
).replace(/\/$/, '');

export const ADMIN_URL = (
  process.env.NEXT_PUBLIC_ADMIN_URL || 'https://app-store-mnlu.vercel.app'
).replace(/\/$/, '');

