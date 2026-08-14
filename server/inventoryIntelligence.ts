import { getStorage } from './storageManager';
import { notificationService } from './notificationService';
import { logger } from './logger';

export interface InventoryAlert {
  id: string;
  type: 'low-stock' | 'expiry' | 'overstock' | 'dead-stock';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  productId: string;
  branchId: string;
  batchId?: string;
  message: string;
  suggestedAction: string;
  createdAt: string;
}

const DEFAULT_LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD || 10);
const DEFAULT_OVERSTOCK_THRESHOLD = Number(process.env.OVERSTOCK_THRESHOLD || 500);

export class InventoryIntelligenceService {
  private dashboardAlerts: InventoryAlert[] = [];
  private schedulerStarted = false;

  startDailyScheduler(): void {
    if (this.schedulerStarted) return;
    this.schedulerStarted = true;
    const scan = async () => {
      try {
        const alerts = await this.scanInventory();
        await this.notifyCriticalAlerts(alerts);
      } catch (error) {
        logger.error('Scheduled inventory scan failed', { error });
      }
    };
    setInterval(scan, 24 * 60 * 60 * 1000);
  }

  async scanInventory(): Promise<InventoryAlert[]> {
    const batches = await getStorage().getStockBatches();
    const now = Date.now();
    const alerts: InventoryAlert[] = [];

    for (const batch of batches) {
      const product = await getStorage().getProduct(batch.productId);
      const productName = product?.name || batch.productId;
      const expiryMs = new Date(batch.expiryDate).getTime() - now;
      const daysToExpiry = Math.ceil(expiryMs / (1000 * 60 * 60 * 24));

      const quantityAvailable = batch.quantityOnHand - batch.quantityReserved;
      if (quantityAvailable <= DEFAULT_LOW_STOCK_THRESHOLD) {
        alerts.push({
          id: `low-${batch.id}`,
          type: 'low-stock',
          severity: quantityAvailable <= 0 ? 'critical' : 'high',
          productId: batch.productId,
          branchId: batch.branchId,
          batchId: batch.id,
          message: `${productName} has ${quantityAvailable} available units, below threshold ${DEFAULT_LOW_STOCK_THRESHOLD}.`,
          suggestedAction: `Reorder ${Math.max(DEFAULT_LOW_STOCK_THRESHOLD * 2 - quantityAvailable, DEFAULT_LOW_STOCK_THRESHOLD)} units from ${batch.supplierName || 'preferred supplier'}.`,
          createdAt: new Date().toISOString(),
        });
      }

      if ([30, 15, 7].some((windowDays) => daysToExpiry <= windowDays && daysToExpiry > windowDays - 7)) {
        alerts.push({
          id: `expiry-${daysToExpiry}-${batch.id}`,
          type: 'expiry',
          severity: daysToExpiry <= 7 ? 'critical' : daysToExpiry <= 15 ? 'high' : 'moderate',
          productId: batch.productId,
          branchId: batch.branchId,
          batchId: batch.id,
          message: `${productName} batch ${batch.batchNumber} expires in ${daysToExpiry} day(s).`,
          suggestedAction: daysToExpiry <= 7 ? 'Quarantine or prioritize pharmacist review immediately.' : 'Prioritize FEFO dispensing and supplier replacement review.',
          createdAt: new Date().toISOString(),
        });
      }

      if (quantityAvailable >= DEFAULT_OVERSTOCK_THRESHOLD) {
        alerts.push({
          id: `overstock-${batch.id}`,
          type: 'overstock',
          severity: 'moderate',
          productId: batch.productId,
          branchId: batch.branchId,
          batchId: batch.id,
          message: `${productName} has ${quantityAvailable} available units, above overstock threshold ${DEFAULT_OVERSTOCK_THRESHOLD}.`,
          suggestedAction: 'Pause reorder, transfer stock to branches with demand, or run controlled promotion.',
          createdAt: new Date().toISOString(),
        });
      }
    }

    this.dashboardAlerts = alerts;
    logger.info('Inventory intelligence scan completed', { alerts: alerts.length });
    return alerts;
  }

  getDashboardAlerts(): InventoryAlert[] {
    return this.dashboardAlerts;
  }

  async notifyCriticalAlerts(alerts: InventoryAlert[]): Promise<void> {
    for (const alert of alerts.filter((candidate) => candidate.severity === 'critical')) {
      await notificationService.enqueue({
        eventType: 'inventory.critical',
        channels: ['email', 'sms'],
        recipient: { email: process.env.INVENTORY_ALERT_EMAIL || 'admin@thandizo.com', phone: process.env.INVENTORY_ALERT_PHONE },
        template: 'inventory-critical-alert',
        variables: { message: alert.message, suggestedAction: alert.suggestedAction },
      });
    }
  }
}

export const inventoryIntelligenceService = new InventoryIntelligenceService();
