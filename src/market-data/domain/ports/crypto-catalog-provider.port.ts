import { AssetOptionRecord } from './asset-option-repository.port';

/**
 * Puerto de salida: catálogo de criptomonedas disponibles (para refrescar
 * "asset_options"), a diferencia de CryptoPriceProviderPort que da el precio
 * de una cripto puntual.
 */
export interface CryptoCatalogProviderPort {
  fetchAll(): Promise<AssetOptionRecord[]>;
}

export const CRYPTO_CATALOG_PROVIDER = Symbol('CRYPTO_CATALOG_PROVIDER');
