import { Inject, Injectable } from '@nestjs/common';
import { BalanceSnapshot } from '../../domain/entities/balance-snapshot.entity';
import { BALANCE_SNAPSHOT_REPOSITORY } from '../../domain/ports/balance-snapshot-repository.port';
import type { BalanceSnapshotRepositoryPort } from '../../domain/ports/balance-snapshot-repository.port';

/**
 * Caso de uso: lista el histórico de fotos del balance total del usuario,
 * ordenado cronológicamente (ver TypeOrmBalanceSnapshotRepository).
 */
@Injectable()
export class ListBalanceSnapshotsUseCase {
  constructor(
    @Inject(BALANCE_SNAPSHOT_REPOSITORY)
    private readonly snapshotRepository: BalanceSnapshotRepositoryPort,
  ) {}

  async execute(userId: string): Promise<BalanceSnapshot[]> {
    return this.snapshotRepository.findByUserId(userId);
  }
}
