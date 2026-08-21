import { GetWatchlistWithPricesResult } from '../../../application/get-watchlist-with-prices/watchlist-item-with-price';
import { TrackedAssetType } from '../../../domain/tracked-asset-type.enum';

export class WatchlistPriceItemDto {
  id: string;
  assetSymbol: string;
  assetType: TrackedAssetType;
  addedAt: string;
  currentPrice: number;
  currency: string;
}

export class WatchlistPriceErrorDto {
  watchlistItemId: string;
  assetSymbol: string;
  message: string;
}

export class WatchlistWithPricesResponseDto {
  items: WatchlistPriceItemDto[];
  errors: WatchlistPriceErrorDto[];

  static fromResult(
    result: GetWatchlistWithPricesResult,
  ): WatchlistWithPricesResponseDto {
    const dto = new WatchlistWithPricesResponseDto();
    dto.items = result.items.map((entry) => ({
      id: entry.item.id,
      assetSymbol: entry.item.assetSymbol,
      assetType: entry.item.assetType,
      addedAt: entry.item.addedAt.toISOString(),
      currentPrice: entry.currentPrice.amount,
      currency: entry.currentPrice.currency,
    }));
    dto.errors = result.errors.map((error) => ({
      watchlistItemId: error.watchlistItemId,
      assetSymbol: error.assetSymbol,
      message: error.message,
    }));
    return dto;
  }
}
