/**
 * Un activo disponible para elegir en un select (watchlist/purchases): el
 * símbolo que espera la API de precios (ticker para stock, id de CoinGecko
 * para crypto) y un nombre legible para mostrar en la UI.
 */
export interface AssetOption {
  symbol: string;
  name: string;
}
