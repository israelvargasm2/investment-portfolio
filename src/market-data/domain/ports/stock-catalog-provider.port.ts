import { AssetOptionRecord } from './asset-option-repository.port';

/**
 * Puerto de salida: catálogo de stocks disponibles (para refrescar
 * "asset_options"), a diferencia de StockPriceProviderPort que da el precio
 * de un stock puntual.
 */
export interface StockCatalogProviderPort {
  fetchAll(): Promise<AssetOptionRecord[]>;
}

export const STOCK_CATALOG_PROVIDER = Symbol('STOCK_CATALOG_PROVIDER');
