/**
 * Se define localmente (en vez de reusar el AssetType de market-data) para que
 * el contexto "watchlist" no dependa de otro contexto; ambos valores coinciden
 * a propósito ('stock' | 'crypto').
 */
export enum TrackedAssetType {
  STOCK = 'stock',
  CRYPTO = 'crypto',
}
