export class InvalidPurchaseDateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPurchaseDateError';
  }
}
