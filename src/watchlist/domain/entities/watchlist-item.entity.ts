import { TrackedAssetType } from '../tracked-asset-type.enum';

/**
 * Entidad de dominio: un activo (stock o cripto) que un usuario sigue.
 */
export class WatchlistItem {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly assetSymbol: string,
    public readonly assetType: TrackedAssetType,
    public readonly addedAt: Date,
  ) {}
}
