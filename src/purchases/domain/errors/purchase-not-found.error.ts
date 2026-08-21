export class PurchaseNotFoundError extends Error {
  constructor(id: string) {
    super(`Purchase "${id}" was not found`);
    this.name = 'PurchaseNotFoundError';
  }
}
