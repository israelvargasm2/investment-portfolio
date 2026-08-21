import { Money } from '../../../../shared/domain/value-objects/money.vo';
import { TtlCache } from '../../../../shared/infrastructure/cache/ttl-cache';
import { CryptoPriceProviderPort } from '../../../domain/ports/crypto-price-provider.port';

// Ver caching-stock-price.adapter.ts: mismo TTL, mismo motivo.
const CRYPTO_PRICE_CACHE_TTL_MS = 60_000;

/**
 * Decorador de caching sobre CryptoPriceProviderPort. La key incluye la
 * moneda pedida (a diferencia del stock, acá el proveedor puede devolver el
 * precio en distintas monedas para el mismo coinId).
 */
export class CachingCryptoPriceProviderAdapter implements CryptoPriceProviderPort {
  private readonly cache = new TtlCache<Money>(CRYPTO_PRICE_CACHE_TTL_MS);

  constructor(private readonly delegate: CryptoPriceProviderPort) {}

  getPrice(coinId: string, currency: string): Promise<Money> {
    const key = `${coinId.toLowerCase()}|${currency.toUpperCase()}`;
    return this.cache.getOrSet(key, () =>
      this.delegate.getPrice(coinId, currency),
    );
  }
}
