/**
 * Definido localmente (igual que TrackedAssetType en watchlist) para que el
 * contexto "purchases" no dependa de market-data ni de watchlist.
 */
export enum PurchaseAssetType {
  STOCK = 'stock',
  CRYPTO = 'crypto',
}
