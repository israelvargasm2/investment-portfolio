export class InvalidRateTiersError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRateTiersError';
  }
}
