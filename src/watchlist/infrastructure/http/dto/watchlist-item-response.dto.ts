import { WatchlistItem } from '../../../domain/entities/watchlist-item.entity';
import { TrackedAssetType } from '../../../domain/tracked-asset-type.enum';

export class WatchlistItemResponseDto {
  id: string;
  assetSymbol: string;
  assetType: TrackedAssetType;
  addedAt: string;

  static fromDomain(item: WatchlistItem): WatchlistItemResponseDto {
    const dto = new WatchlistItemResponseDto();
    dto.id = item.id;
    dto.assetSymbol = item.assetSymbol;
    dto.assetType = item.assetType;
    dto.addedAt = item.addedAt.toISOString();
    return dto;
  }
}
