export class BalanceSnapshotNotFoundError extends Error {
  constructor(id: string) {
    super(`Balance snapshot "${id}" was not found`);
    this.name = 'BalanceSnapshotNotFoundError';
  }
}
