import { Money } from '../../../shared/domain/value-objects/money.vo';
import { BalanceSnapshot } from '../entities/balance-snapshot.entity';

export interface NewBalanceSnapshotData {
  userId: string;
  totalAmount: Money;
  longMediumTermAmount: Money;
  shortTermAmount: Money;
}

/**
 * Puerto de salida: persistencia de fotos históricas del balance total.
 * Cualquier motor de base de datos se conecta implementando esta interfaz.
 */
export interface BalanceSnapshotRepositoryPort {
  findByUserId(userId: string): Promise<BalanceSnapshot[]>;
  create(data: NewBalanceSnapshotData): Promise<BalanceSnapshot>;
  deleteByIdAndUserId(id: string, userId: string): Promise<boolean>;
}

export const BALANCE_SNAPSHOT_REPOSITORY = Symbol(
  'BALANCE_SNAPSHOT_REPOSITORY',
);
