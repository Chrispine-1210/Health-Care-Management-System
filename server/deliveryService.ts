import { getStorage } from './storageManager';
import { logger } from './logger';

/**
 * Delivery Service - GPS tracking and delivery management
 */

export class DeliveryService {
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static async assignDelivery(orderId: string, driverId: string, estimatedTime: number) {
    try {
      const storage = getStorage();
      const delivery = await storage.createDelivery({
        orderId,
        driverId,
        status: 'assigned',
        estimatedTime,
      });

      logger.info('Delivery assigned', { deliveryId: delivery.id, driverId, orderId });
      return delivery;
    } catch (error) {
      logger.error('Delivery assignment failed', { error, orderId, driverId });
      throw error;
    }
  }

  static async updateDeliveryLocation(deliveryId: string, latitude: number, longitude: number) {
    try {
      const storage = getStorage();
      // Store location update (in real app, would store GPS trail)
      logger.info('Location updated', { deliveryId, latitude, longitude });
      return { id: deliveryId, latitude, longitude };
    } catch (error) {
      logger.error('Location update failed', { error, deliveryId });
      throw error;
    }
  }

  static async completeDelivery(deliveryId: string) {
    try {
      const storage = getStorage();
      const delivery = await storage.updateDelivery(deliveryId, { status: 'delivered' });
      logger.info('Delivery completed', { deliveryId });
      return delivery;
    } catch (error) {
      logger.error('Delivery completion failed', { error, deliveryId });
      throw error;
    }
  }
}
