import { Inject, Injectable } from '@nestjs/common';
import { BalanceSnapshotNotFoundError } from '../../domain/errors/balance-snapshot-not-found.error';
import { BALANCE_SNAPSHOT_REPOSITORY } from '../../domain/ports/balance-snapshot-repository.port';
import type { BalanceSnapshotRepositoryPort } from '../../domain/ports/balance-snapshot-repository.port';

/**
 * Caso de uso: elimina una foto histórica. Solo borra si pertenece al
 * usuario que lo pide.
 */
@Injectable()
export class RemoveBalanceSnapshotUseCase {
  constructor(
    @Inject(BALANCE_SNAPSHOT_REPOSITORY)
    private readonly snapshotRepository: BalanceSnapshotRepositoryPort,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const wasDeleted = await this.snapshotRepository.deleteByIdAndUserId(
      id,
      userId,
    );
    if (!wasDeleted) {
      throw new BalanceSnapshotNotFoundError(id);
    }
  }
}
