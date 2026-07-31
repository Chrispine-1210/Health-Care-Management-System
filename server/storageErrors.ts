export class InsufficientStockError extends Error {
  constructor(public readonly productId: string) {
    super(`Insufficient eligible stock for product ${productId}`);
    this.name = 'InsufficientStockError';
  }
}
