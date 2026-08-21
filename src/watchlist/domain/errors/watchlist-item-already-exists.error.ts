import { TrackedAssetType } from '../tracked-asset-type.enum';

export class WatchlistItemAlreadyExistsError extends Error {
  constructor(assetSymbol: string, assetType: TrackedAssetType) {
    super(`Asset "${assetSymbol}" (${assetType}) is already in the watchlist`);
    this.name = 'WatchlistItemAlreadyExistsError';
  }
}
