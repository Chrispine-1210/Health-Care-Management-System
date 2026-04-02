import type { Express } from 'express';
import { authenticateToken, requireRole } from './authMiddleware';
import { OrderFilters } from './orderFilters';
import { logger } from './logger';

/**
 * Enhanced Orders API with filters, search, sorting
 */

export function registerOrdersApi(app: Express) {
  /**
   * GET /api/orders/search - Search and filter orders
   */
  app.get('/api/orders/search', authenticateToken, async (req, res) => {
    try {
      const { status, minPrice, maxPrice, sortBy, search } = req.query;
      
      // Mock data - in production, query database
      let orders = [
        { id: 'ORD-001', customerId: req.user!.id, status: 'pending', total: 5000, createdAt: new Date() },
        { id: 'ORD-002', customerId: req.user!.id, status: 'delivered', total: 3500, createdAt: new Date() },
      ];

      // Apply filters
      if (status) {
        orders = OrderFilters.filterByStatus(orders, status as string);
      }
      if (minPrice || maxPrice) {
        const min = minPrice ? parseInt(minPrice as string) : 0;
        const max = maxPrice ? parseInt(maxPrice as string) : Infinity;
        orders = OrderFilters.filterByPriceRange(orders, min, max);
      }
      if (search) {
        orders = OrderFilters.search(orders, search as string);
      }
      if (sortBy) {
        orders = OrderFilters.sort(orders, sortBy as any);
      }

      res.json({
        success: true,
        data: {
          total: orders.length,
          orders,
        },
      });
    } catch (error) {
      logger.error('Order search failed', { error });
      res.status(500).json({ success: false, message: 'Search failed' });
    }
  });

  /**
   * GET /api/orders/:id/tracking - Real-time order tracking
   */
  app.get('/api/orders/:id/tracking', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;

      const tracking = {
        orderId: id,
        status: 'in_transit',
        driver: {
          id: 'driver-1',
          name: 'John Banda',
          phone: '+265123456789',
          vehicle: 'Toyota Hiace',
        },
        location: {
          latitude: -13.9626,
          longitude: 33.7741,
          lastUpdated: new Date(),
        },
        estimatedArrival: new Date(Date.now() + 30 * 60 * 1000), // 30 mins
        route: [
          { latitude: -13.9626, longitude: 33.7741, name: 'Current Location' },
          { latitude: -13.9627, longitude: 33.7742, name: 'Pickup Point' },
          { latitude: -13.9628, longitude: 33.7743, name: 'Destination' },
        ],
      };

      res.json({
        success: true,
        data: tracking,
      });
    } catch (error) {
      logger.error('Tracking fetch failed', { error });
      res.status(500).json({ success: false, message: 'Tracking failed' });
    }
  });

  /**
   * GET /api/orders/stats - Order statistics
   */
  app.get('/api/orders/stats', authenticateToken, requireRole('admin', 'pharmacist'), async (req, res) => {
    try {
      const stats = {
        total: 156,
        pending: 12,
        confirmed: 8,
        processing: 5,
        ready: 3,
        in_transit: 4,
        delivered: 120,
        cancelled: 4,
        averageValue: 4500,
        totalRevenue: 702000,
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Stats fetch failed', { error });
      res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
  });

  logger.info('Orders API endpoints registered');
}
