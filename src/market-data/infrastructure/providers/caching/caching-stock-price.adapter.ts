import { Money } from '../../../../shared/domain/value-objects/money.vo';
import { TtlCache } from '../../../../shared/infrastructure/cache/ttl-cache';
import { StockPriceProviderPort } from '../../../domain/ports/stock-price-provider.port';

// 1 minuto: suficiente para absorber recargas seguidas de /purchases,
// /purchases/charts y la validación de símbolo del formulario sin pegarle
// de nuevo a Finnhub/Yahoo Finance por cada una, sin que el precio quede
// desactualizado de forma perceptible para un tracker de cartera (no es un
// terminal de trading).
const STOCK_PRICE_CACHE_TTL_MS = 60_000;

/**
 * Decorador de caching sobre StockPriceProviderPort: envuelve al adaptador
 * real (RoutedStockPriceAdapter) sin que GetAssetPricesUseCase sepa que hay
 * un cache de por medio — sigue viendo el mismo puerto. La key se
 * normaliza a mayúsculas para que "walmex.mx" y "WALMEX.MX" compartan
 * entrada (RoutedStockPriceAdapter ya rutea sin distinguir mayúsculas).
 */
export class CachingStockPriceProviderAdapter implements StockPriceProviderPort {
  private readonly cache = new TtlCache<Money>(STOCK_PRICE_CACHE_TTL_MS);

  constructor(private readonly delegate: StockPriceProviderPort) {}

  getPrice(symbol: string): Promise<Money> {
    return this.cache.getOrSet(symbol.toUpperCase(), () =>
      this.delegate.getPrice(symbol),
    );
  }
}
