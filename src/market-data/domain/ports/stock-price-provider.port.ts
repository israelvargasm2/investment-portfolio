import { Money } from '../../../shared/domain/value-objects/money.vo';

/**
 * Puerto de salida: obtiene el precio actual de una acción en su moneda nativa del proveedor.
 */
export interface StockPriceProviderPort {
  getPrice(symbol: string): Promise<Money>;
}

export const STOCK_PRICE_PROVIDER = Symbol('STOCK_PRICE_PROVIDER');
