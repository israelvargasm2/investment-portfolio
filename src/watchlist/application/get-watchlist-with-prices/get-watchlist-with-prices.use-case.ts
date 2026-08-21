import { Inject, Injectable } from '@nestjs/common';
import { GetAssetPricesUseCase } from '../../../market-data/application/get-asset-prices/get-asset-prices.use-case';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { WatchlistItem } from '../../domain/entities/watchlist-item.entity';
import { WATCHLIST_REPOSITORY } from '../../domain/ports/watchlist-repository.port';
import type { WatchlistRepositoryPort } from '../../domain/ports/watchlist-repository.port';
import { TrackedAssetType } from '../../domain/tracked-asset-type.enum';
import {
  GetWatchlistWithPricesResult,
  WatchlistItemWithPrice,
  WatchlistPriceError,
} from './watchlist-item-with-price';

const DEFAULT_CURRENCY = 'USD';

/**
 * Caso de uso: obtiene la watchlist del usuario junto con el precio actual de
 * cada activo (reusa GetAssetPricesUseCase de market-data, igual que
 * GetPurchasesPerformanceUseCase en el contexto "purchases").
 *
 * A diferencia de las compras, los items de la watchlist no tienen una
 * moneda propia (no representan una transacción), así que el precio se pide
 * siempre en DEFAULT_CURRENCY.
 */
@Injectable()
export class GetWatchlistWithPricesUseCase {
  constructor(
    @Inject(WATCHLIST_REPOSITORY)
    private readonly watchlistRepository: WatchlistRepositoryPort,
    private readonly getAssetPrices: GetAssetPricesUseCase,
  ) {}

  async execute(userId: string): Promise<GetWatchlistWithPricesResult> {
    const items = await this.watchlistRepository.findByUserId(userId);
    if (items.length === 0) {
      return { items: [], errors: [] };
    }

    const currentPricesByKey = await this.resolveCurrentPrices(items);

    const itemsWithPrices: WatchlistItemWithPrice[] = [];
    const errors: WatchlistPriceError[] = [];

    for (const item of items) {
      const currentPrice = currentPricesByKey.get(
        this.priceKey(item.assetSymbol, item.assetType),
      );
      if (!currentPrice) {
        errors.push({
          watchlistItemId: item.id,
          assetSymbol: item.assetSymbol,
          message: `Current price unavailable for "${item.assetSymbol}"`,
        });
        continue;
      }
      itemsWithPrices.push({ item, currentPrice });
    }

    return { items: itemsWithPrices, errors };
  }

  private async resolveCurrentPrices(
    items: WatchlistItem[],
  ): Promise<Map<string, Money>> {
    const stockSymbols = this.distinctSymbols(items, TrackedAssetType.STOCK);
    const cryptoIds = this.distinctSymbols(items, TrackedAssetType.CRYPTO);

    const result = await this.getAssetPrices.execute({
      stockSymbols,
      cryptoIds,
      targetCurrency: DEFAULT_CURRENCY,
    });

    const pricesByKey = new Map<string, Money>();
    for (const assetPrice of result.prices) {
      pricesByKey.set(
        this.priceKey(assetPrice.assetSymbol, assetPrice.assetType),
        assetPrice.price,
      );
    }
    return pricesByKey;
  }

  private distinctSymbols(
    items: WatchlistItem[],
    assetType: TrackedAssetType,
  ): string[] {
    const symbols = items
      .filter((item) => item.assetType === assetType)
      .map((item) => item.assetSymbol);
    return Array.from(new Set(symbols));
  }

  private priceKey(assetSymbol: string, assetType: string): string {
    return `${assetSymbol}|${assetType}`;
  }
}
