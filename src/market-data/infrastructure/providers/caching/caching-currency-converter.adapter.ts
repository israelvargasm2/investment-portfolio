import { TtlCache } from '../../../../shared/infrastructure/cache/ttl-cache';
import { CurrencyConverterPort } from '../../../domain/ports/currency-converter.port';

// Frankfurter publica tasas del BCE que se actualizan una vez por día
// hábil: cachear la tasa (no el monto convertido) durante una hora no pierde
// precisión perceptible y evita golpear la API en cada compra en moneda
// distinta a la de destino.
const EXCHANGE_RATE_CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Decorador de caching sobre CurrencyConverterPort. Cachea la TASA
 * (convert(1, from, to)), no el monto convertido: dos llamadas con distinto
 * `amount` para el mismo par de monedas comparten la misma tasa cacheada, y
 * la multiplicación se hace acá, no en el proveedor.
 */
export class CachingCurrencyConverterAdapter implements CurrencyConverterPort {
  private readonly cache = new TtlCache<number>(EXCHANGE_RATE_CACHE_TTL_MS);

  constructor(private readonly delegate: CurrencyConverterPort) {}

  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();
    if (from === to) {
      return amount;
    }

    const rate = await this.cache.getOrSet(`${from}|${to}`, () =>
      this.delegate.convert(1, from, to),
    );
    return amount * rate;
  }
}
