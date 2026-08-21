import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PurchaseAssetType } from '../../../domain/purchase-asset-type.enum';

/**
 * Modelo de fila de TypeORM para "purchases". Sin relación @ManyToOne a
 * UserOrmEntity a propósito, igual que en watchlist: la FK vive en la migration.
 */
@Entity({ name: 'purchases' })
export class PurchaseOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar' })
  assetSymbol: string;

  @Column({ type: 'varchar' })
  assetType: PurchaseAssetType;

  @Column({ type: 'double precision' })
  quantity: number;

  @Column({ type: 'double precision' })
  purchasePriceAmount: number;

  @Column({ type: 'varchar' })
  purchasePriceCurrency: string;

  @Column({ type: 'timestamp' })
  purchasedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
