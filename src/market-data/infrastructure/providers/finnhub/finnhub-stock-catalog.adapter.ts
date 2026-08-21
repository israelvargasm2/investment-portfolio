import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AssetType } from '../../../domain/asset-type.enum';
import { RateLimitExceededError } from '../../../domain/errors/rate-limit-exceeded.error';
import { AssetOptionRecord } from '../../../domain/ports/asset-option-repository.port';
import { StockCatalogProviderPort } from '../../../domain/ports/stock-catalog-provider.port';
import { FinnhubSymbol } from './finnhub-symbol';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const US_EXCHANGE = 'US';

// Tipos de instrumento de Finnhub que esta app trata como "stock" (se
// pueden trackear en watchlist/purchases igual que una acción común): tanto
// acciones comunes como ETFs (ej. IVV, VOO, QQQ, SPY — Finnhub los agrupa
// bajo "ETP", Exchange Traded Product). Se deja afuera todo lo demás (ADRs,
// warrants, preferentes, rights, units, etc.): son otro tipo de instrumento,
// no lo que un usuario de esta app espera encontrar tipeando un ticker.
const TRACKABLE_TYPES: ReadonlySet<string> = new Set(['Common Stock', 'ETP']);

/**
 * Adaptador de salida que trae TODOS los símbolos de EE.UU. desde Finnhub
 * (sin tope: son varios miles), para refrescar el catálogo de
 * "asset_options". Se filtra a `TRACKABLE_TYPES` (acciones comunes + ETFs).
 *
 * Solo cubre EE.UU.: el plan gratuito de Finnhub no incluye datos
 * fundamentales de otras bolsas (ver RoutedStockPriceAdapter y
 * bmv-stock-catalog.constants.ts para la Bolsa Mexicana de Valores, que se
 * mantiene curada a mano por ese motivo).
 */
@Injectable()
export class FinnhubStockCatalogAdapter implements StockCatalogProviderPort {
  constructor(private readonly configService: ConfigService) {}

  async fetchAll(): Promise<AssetOptionRecord[]> {
    const apiKey = this.configService.get<string>('FINNHUB_API_KEY');
    const url = `${FINNHUB_BASE_URL}/stock/symbol?exchange=${US_EXCHANGE}&token=${apiKey}`;

    const response = await fetch(url);
    if (response.status === 429) {
      throw new RateLimitExceededError('Finnhub');
    }
    if (!response.ok) {
      throw new Error(`Finnhub request failed with status ${response.status}`);
    }

    const symbols = (await response.json()) as FinnhubSymbol[];
    return symbols
      .filter((entry) => TRACKABLE_TYPES.has(entry.type))
      .map((entry) => ({
        symbol: entry.symbol,
        name: entry.description,
        assetType: AssetType.STOCK,
      }));
  }
}
