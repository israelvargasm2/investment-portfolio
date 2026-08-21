import { WatchlistItem } from '../entities/watchlist-item.entity';
import { TrackedAssetType } from '../tracked-asset-type.enum';

export interface NewWatchlistItemData {
  userId: string;
  assetSymbol: string;
  assetType: TrackedAssetType;
}

export interface WatchlistItemAssetData {
  assetSymbol: string;
  assetType: TrackedAssetType;
}

/**
 * Puerto de salida: persistencia de la watchlist. Cualquier motor de base de
 * datos se conecta implementando esta interfaz.
 */
export interface WatchlistRepositoryPort {
  findByUserId(userId: string): Promise<WatchlistItem[]>;
  findByUserIdAndAsset(
    userId: string,
    assetSymbol: string,
    assetType: TrackedAssetType,
  ): Promise<WatchlistItem | null>;
  create(newItem: NewWatchlistItemData): Promise<WatchlistItem>;
  updateByIdAndUserId(
    id: string,
    userId: string,
    data: WatchlistItemAssetData,
  ): Promise<WatchlistItem | null>;
  deleteByIdAndUserId(id: string, userId: string): Promise<boolean>;
}

export const WATCHLIST_REPOSITORY = Symbol('WATCHLIST_REPOSITORY');
