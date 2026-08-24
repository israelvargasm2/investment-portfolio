import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

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

  @CreateDateColumn()
  createdAt: Date;
}
