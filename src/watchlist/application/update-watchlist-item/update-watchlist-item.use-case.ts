import { Inject, Injectable } from '@nestjs/common';
import { WatchlistItem } from '../../domain/entities/watchlist-item.entity';
import { WatchlistItemAlreadyExistsError } from '../../domain/errors/watchlist-item-already-exists.error';
import { WatchlistItemNotFoundError } from '../../domain/errors/watchlist-item-not-found.error';
import { WATCHLIST_REPOSITORY } from '../../domain/ports/watchlist-repository.port';
import type {
  WatchlistItemAssetData,
  WatchlistRepositoryPort,
} from '../../domain/ports/watchlist-repository.port';

/**
 * Caso de uso: edita el símbolo/tipo de un activo de la watchlist. Evita
 * duplicados (mismo usuario + símbolo + tipo en otro item) igual que al crear.
 */
@Injectable()
export class UpdateWatchlistItemUseCase {
  constructor(
    @Inject(WATCHLIST_REPOSITORY)
    private readonly watchlistRepository: WatchlistRepositoryPort,
  ) {}

  async execute(
    id: string,
    userId: string,
    data: WatchlistItemAssetData,
  ): Promise<WatchlistItem> {
    const conflictingItem = await this.watchlistRepository.findByUserIdAndAsset(
      userId,
      data.assetSymbol,
      data.assetType,
    );
    if (conflictingItem && conflictingItem.id !== id) {
      throw new WatchlistItemAlreadyExistsError(
        data.assetSymbol,
        data.assetType,
      );
    }

    const updatedItem = await this.watchlistRepository.updateByIdAndUserId(
      id,
      userId,
      data,
    );
    if (!updatedItem) {
      throw new WatchlistItemNotFoundError(id);
    }

    return updatedItem;
  }
}
