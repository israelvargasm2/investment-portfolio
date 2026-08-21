import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { AssetType } from '../../../domain/asset-type.enum';

/**
 * Modelo de fila de TypeORM para "asset_options": el catálogo de stocks/cripto
 * disponibles para elegir en watchlist/purchases. `updatedAt` existe pensando
 * en un futuro job que refresque el catálogo (ver README/CLAUDE.md) — hoy se
 * actualiza a mano (migration o SQL directo).
 */
@Entity({ name: 'asset_options' })
@Unique(['symbol', 'assetType'])
export class AssetOptionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  symbol: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  assetType: AssetType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
