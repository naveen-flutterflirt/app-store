import * as http from 'http';
import { verifyJwt } from './jwt.helper';

export function resolveDeveloperId(req: http.IncomingMessage): string {
  // 1. Try Bearer JWT Token
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const payload = verifyJwt(token);
    if (payload && payload.developer_id) {
      return payload.developer_id;
    }
  }

  // 2. Try explicit header x-developer-id
  const headerDevId = req.headers['x-developer-id'] as string;
  if (headerDevId && headerDevId.trim()) {
    return headerDevId.trim();
  }

  // 3. Fallback to default partner organization (KitchenMetrics)
  return '60fba5bd-cbc8-4c28-8a53-b6e8e3d45bdf';
}
