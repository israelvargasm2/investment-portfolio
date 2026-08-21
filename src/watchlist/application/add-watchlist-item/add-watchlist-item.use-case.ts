import { Inject, Injectable } from '@nestjs/common';
import { WatchlistItem } from '../../domain/entities/watchlist-item.entity';
import { WatchlistItemAlreadyExistsError } from '../../domain/errors/watchlist-item-already-exists.error';
import { WATCHLIST_REPOSITORY } from '../../domain/ports/watchlist-repository.port';
import type {
  NewWatchlistItemData,
  WatchlistRepositoryPort,
} from '../../domain/ports/watchlist-repository.port';

/**
 * Caso de uso: agrega un activo a la watchlist del usuario, evitando duplicados
 * (mismo usuario + símbolo + tipo).
 */
@Injectable()
export class AddWatchlistItemUseCase {
  constructor(
    @Inject(WATCHLIST_REPOSITORY)
    private readonly watchlistRepository: WatchlistRepositoryPort,
  ) {}

  async execute(newItem: NewWatchlistItemData): Promise<WatchlistItem> {
    const existingItem = await this.watchlistRepository.findByUserIdAndAsset(
      newItem.userId,
      newItem.assetSymbol,
      newItem.assetType,
    );
    if (existingItem) {
      throw new WatchlistItemAlreadyExistsError(
        newItem.assetSymbol,
        newItem.assetType,
      );
    }

    return this.watchlistRepository.create(newItem);
  }
}
