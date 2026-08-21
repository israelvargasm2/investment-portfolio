export class WatchlistItemNotFoundError extends Error {
  constructor(id: string) {
    super(`Watchlist item "${id}" was not found`);
    this.name = 'WatchlistItemNotFoundError';
  }
}
