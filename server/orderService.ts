import { getStorage } from './storageManager';
import { logger } from './logger';

/**
 * Order Service - Business logic for orders
 */

export class OrderService {
  static calculateDeliveryFee(distanceKm: number): number {
    const baseFee = 500; // MK
    const perKm = 50; // MK
    return baseFee + Math.ceil(distanceKm * perKm);
  }

  static async createOrder(customerId: string, items: any[], paymentMethod: string, deliveryLocation?: any) {
    try {
      const storage = getStorage();
      
      // Calculate totals
      const itemTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const deliveryFee = deliveryLocation ? this.calculateDeliveryFee(deliveryLocation.distance) : 0;
      const total = itemTotal + deliveryFee;

      const order = await storage.createOrder({
        customerId,
        items,
        paymentMethod,
        total,
        deliveryFee,
        status: 'pending',
        notes: deliveryLocation?.notes,
      });

      logger.info('Order created', { orderId: order.id, customerId, total });
      return order;
    } catch (error) {
      logger.error('Order creation failed', { error, customerId });
      throw error;
    }
  }

  static async updateOrderStatus(orderId: string, status: string) {
    try {
      const storage = getStorage();
      const order = await storage.updateOrder(orderId, { status });
      
      logger.info('Order status updated', { orderId, status });
      return order;
    } catch (error) {
      logger.error('Order update failed', { error, orderId });
      throw error;
    }
  }

  static async getOrdersByCustomer(customerId: string) {
    try {
      const storage = getStorage();
      return await storage.getOrders();
    } catch (error) {
      logger.error('Failed to fetch customer orders', { error, customerId });
      throw error;
    }
  }
}
