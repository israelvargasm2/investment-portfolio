import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BalanceSnapshotScope } from '../../../domain/balance-snapshot-scope.enum';

/**
 * Modelo de fila de TypeORM para "balance_snapshots". Sin relación
 * @ManyToOne a UserOrmEntity a propósito, igual que accounts/purchases/
 * watchlist: la FK vive en la migration.
 */
@Entity({ name: 'balance_snapshots' })
export class BalanceSnapshotOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'double precision' })
  totalAmount: number;

  @Column({ type: 'varchar' })
  currency: string;

  @Column({ type: 'varchar' })
  scope: BalanceSnapshotScope;

  @CreateDateColumn()
  createdAt: Date;
}
