import * as http from 'http';

const PORT = process.env.PORT || 4000;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  console.log(`[API Gateway] ${req.method} ${pathname}`);

  // Healthcheck endpoint
  if (pathname === '/health' || pathname === '/v1/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', platform: 'BizBox App Store API', version: '1.0.0' }));
    return;
  }

  // 1. Storefront Categories & Apps
  if (pathname === '/v1/store/categories') {
    res.writeHead(200);
    res.end(JSON.stringify([
      { category: 'Sales & POS', count: 3 },
      { category: 'Kitchen', count: 1 },
      { category: 'Online orders', count: 3 },
      { category: 'Inventory', count: 2 },
      { category: 'Customers', count: 2 },
      { category: 'Marketing', count: 1 },
      { category: 'Finance & GST', count: 3 },
      { category: 'Staff', count: 1 },
      { category: 'Devices', count: 1 },
      { category: 'Industry', count: 2 },
      { category: 'Analytics', count: 2 },
      { category: 'AI', count: 1 }
    ]));
    return;
  }

  // Fallback 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Endpoint not implemented in mock gateway', path: pathname }));
});

server.listen(PORT, () => {
  console.log(`✓ BizBox API Gateway running on http://localhost:${PORT}/v1`);
  console.log(`✓ OpenAPI Spec: /openapi/appstore_openapi.yaml (51 endpoints)`);
});
