import { Inject, Injectable } from '@nestjs/common';
import { WatchlistItemNotFoundError } from '../../domain/errors/watchlist-item-not-found.error';
import { WATCHLIST_REPOSITORY } from '../../domain/ports/watchlist-repository.port';
import type { WatchlistRepositoryPort } from '../../domain/ports/watchlist-repository.port';

/**
 * Caso de uso: quita un activo de la watchlist del usuario. Solo borra si el
 * item pertenece al usuario que lo pide (evita que un usuario borre items de otro).
 */
@Injectable()
export class RemoveWatchlistItemUseCase {
  constructor(
    @Inject(WATCHLIST_REPOSITORY)
    private readonly watchlistRepository: WatchlistRepositoryPort,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const wasDeleted = await this.watchlistRepository.deleteByIdAndUserId(
      id,
      userId,
    );
    if (!wasDeleted) {
      throw new WatchlistItemNotFoundError(id);
    }
  }
}
