import { Money } from '../../../shared/domain/value-objects/money.vo';
import { WatchlistItem } from '../../domain/entities/watchlist-item.entity';

export interface WatchlistItemWithPrice {
  item: WatchlistItem;
  currentPrice: Money;
}

export interface WatchlistPriceError {
  watchlistItemId: string;
  assetSymbol: string;
  message: string;
}

export interface GetWatchlistWithPricesResult {
  items: WatchlistItemWithPrice[];
  errors: WatchlistPriceError[];
}
