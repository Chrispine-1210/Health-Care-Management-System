import type { Express } from 'express';

interface Endpoint {
  path: string;
  method: string;
  description: string;
  auth: boolean;
  roles?: string[];
  requestSchema?: any;
  responseSchema?: any;
}

const endpoints: Endpoint[] = [
  // Auth
  { path: '/api/login', method: 'POST', description: 'User login', auth: false },
  { path: '/api/signup', method: 'POST', description: 'User registration', auth: false },
  { path: '/api/logout', method: 'POST', description: 'User logout', auth: true },
  { path: '/api/auth/user', method: 'GET', description: 'Get current user', auth: true },

  // Products
  { path: '/api/products', method: 'GET', description: 'List products', auth: false },
  { path: '/api/products/:id', method: 'GET', description: 'Get product details', auth: false },

  // Orders
  { path: '/api/orders', method: 'POST', description: 'Create order', auth: true, roles: ['customer', 'staff'] },
  { path: '/api/orders/:id', method: 'GET', description: 'Get order details', auth: true },
  { path: '/api/orders/:id/pay', method: 'POST', description: 'Process payment', auth: true },

  // Prescriptions
  { path: '/api/prescriptions', method: 'GET', description: 'List prescriptions', auth: true },
  { path: '/api/prescriptions/:id/review', method: 'POST', description: 'Review prescription', auth: true, roles: ['pharmacist'] },

  // Deliveries
  { path: '/api/deliveries', method: 'GET', description: 'List deliveries', auth: true, roles: ['driver'] },
  { path: '/api/deliveries/:id/status', method: 'PATCH', description: 'Update delivery status', auth: true, roles: ['driver'] },
];

export function setupAPIDocsRoute(app: Express) {
  app.get('/api/docs', (req, res) => {
    res.json({
      name: 'Thandizo Pharmacy API',
      version: '1.0.0',
      baseURL: `${req.protocol}://${req.get('host')}`,
      endpoints,
    });
  });

  app.get('/api/docs/:endpoint', (req, res) => {
    const endpoint = endpoints.find(e => e.path === `/api/${req.params.endpoint}`);
    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    res.json(endpoint);
  });
}
