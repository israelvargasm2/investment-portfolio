export class AccountNotFoundError extends Error {
  constructor(id: string) {
    super(`Account "${id}" was not found`);
    this.name = 'AccountNotFoundError';
  }
}
