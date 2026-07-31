export class InsufficientStockError extends Error {
  constructor(public readonly productId: string) {
    super(`Insufficient eligible stock for product ${productId}`);
    this.name = 'InsufficientStockError';
  }
}

export class InvalidStockAdjustmentError extends Error {
  constructor(message = 'Stock adjustment would produce an invalid balance') {
    super(message);
    this.name = 'InvalidStockAdjustmentError';
  }
}
