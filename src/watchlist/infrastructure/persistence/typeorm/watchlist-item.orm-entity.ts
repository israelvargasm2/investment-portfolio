import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { TrackedAssetType } from '../../../domain/tracked-asset-type.enum';

/**
 * Modelo de fila de TypeORM para "watchlist_items". Sin relación @ManyToOne a
 * UserOrmEntity a propósito: la integridad referencial vive en la migration
 * (FK en SQL), no como import cruzado entre los contextos "watchlist" y "users".
 */
@Entity({ name: 'watchlist_items' })
@Unique(['userId', 'assetSymbol', 'assetType'])
export class WatchlistItemOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar' })
  assetSymbol: string;

  @Column({ type: 'varchar' })
  assetType: TrackedAssetType;

  @CreateDateColumn()
  addedAt: Date;
}
