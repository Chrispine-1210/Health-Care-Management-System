/**
 * Inventory Management & Tracking
 */

interface InventoryItem {
  productId: string;
  quantity: number;
  reorderLevel: number;
  lastRestockDate: Date;
}

export class InventoryManager {
  private inventory: Map<string, InventoryItem> = new Map();

  addStock(productId: string, quantity: number) {
    const item = this.inventory.get(productId);
    if (item) {
      item.quantity += quantity;
      item.lastRestockDate = new Date();
    }
  }

  removeStock(productId: string, quantity: number): boolean {
    const item = this.inventory.get(productId);
    if (!item || item.quantity < quantity) {
      return false;
    }
    item.quantity -= quantity;
    return true;
  }

  getStock(productId: string): number {
    return this.inventory.get(productId)?.quantity ?? 0;
  }

  isLowStock(productId: string): boolean {
    const item = this.inventory.get(productId);
    return item ? item.quantity <= item.reorderLevel : false;
  }

  getLowStockItems(): InventoryItem[] {
    return Array.from(this.inventory.values()).filter(
      item => item.quantity <= item.reorderLevel
    );
  }

  getReorderSuggestions() {
    return this.getLowStockItems().map(item => ({
      productId: item.productId,
      currentStock: item.quantity,
      reorderLevel: item.reorderLevel,
      suggestedQuantity: item.reorderLevel * 2 - item.quantity,
    }));
  }
}

export const inventoryManager = new InventoryManager();
