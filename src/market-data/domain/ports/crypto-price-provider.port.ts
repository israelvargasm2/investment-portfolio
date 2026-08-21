import { Money } from '../../../shared/domain/value-objects/money.vo';

/**
 * Puerto de salida: obtiene el precio actual de una criptomoneda directamente en la moneda solicitada.
 */
export interface CryptoPriceProviderPort {
  getPrice(coinId: string, currency: string): Promise<Money>;
}

export const CRYPTO_PRICE_PROVIDER = Symbol('CRYPTO_PRICE_PROVIDER');
