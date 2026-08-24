import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Money } from '../../../../shared/domain/value-objects/money.vo';
import { BalanceSnapshot } from '../../../domain/entities/balance-snapshot.entity';
import {
  BalanceSnapshotRepositoryPort,
  NewBalanceSnapshotData,
} from '../../../domain/ports/balance-snapshot-repository.port';
import { BalanceSnapshotOrmEntity } from './balance-snapshot.orm-entity';

/**
 * Adaptador de salida: implementa BalanceSnapshotRepositoryPort usando
 * TypeORM sobre Postgres.
 */
@Injectable()
export class TypeOrmBalanceSnapshotRepository implements BalanceSnapshotRepositoryPort {
  constructor(
    @InjectRepository(BalanceSnapshotOrmEntity)
    private readonly repository: Repository<BalanceSnapshotOrmEntity>,
  ) {}

  async findByUserId(userId: string): Promise<BalanceSnapshot[]> {
    const rows = await this.repository.find({
      where: { userId },
      // Ascendente (cronológico, el más viejo primero): pensado para armar
      // un histórico/gráfico en el tiempo, no una lista tipo "actividad
      // reciente arriba" como purchases/watchlist.
      order: { createdAt: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async create(data: NewBalanceSnapshotData): Promise<BalanceSnapshot> {
    const row = this.repository.create({
      userId: data.userId,
      totalAmount: data.total.amount,
      currency: data.total.currency,
    });
    const savedRow = await this.repository.save(row);
    return this.toDomain(savedRow);
  }

  async deleteByIdAndUserId(id: string, userId: string): Promise<boolean> {
    const result = await this.repository.delete({ id, userId });
    return (result.affected ?? 0) > 0;
  }

  private toDomain(row: BalanceSnapshotOrmEntity): BalanceSnapshot {
    return new BalanceSnapshot(
      row.id,
      row.userId,
      Money.of(row.totalAmount, row.currency),
      row.createdAt,
    );
  }
}
