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

export class InvalidOrderCancellationError extends Error {
  constructor(public readonly code: 'NOT_FOUND' | 'NOT_ELIGIBLE' | 'IDEMPOTENCY_CONFLICT', message: string) {
    super(message);
    this.name = 'InvalidOrderCancellationError';
  }
}

export class InvalidDispensingError extends Error {
  constructor(public readonly code: 'NOT_FOUND' | 'NOT_ELIGIBLE' | 'IDEMPOTENCY_CONFLICT', message: string) {
    super(message);
    this.name = 'InvalidDispensingError';
  }
}
