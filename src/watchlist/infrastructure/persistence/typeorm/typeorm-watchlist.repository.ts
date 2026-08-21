import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchlistItem } from '../../../domain/entities/watchlist-item.entity';
import {
  NewWatchlistItemData,
  WatchlistItemAssetData,
  WatchlistRepositoryPort,
} from '../../../domain/ports/watchlist-repository.port';
import { TrackedAssetType } from '../../../domain/tracked-asset-type.enum';
import { WatchlistItemOrmEntity } from './watchlist-item.orm-entity';

/**
 * Adaptador de salida: implementa WatchlistRepositoryPort usando TypeORM sobre Postgres.
 */
@Injectable()
export class TypeOrmWatchlistRepository implements WatchlistRepositoryPort {
  constructor(
    @InjectRepository(WatchlistItemOrmEntity)
    private readonly repository: Repository<WatchlistItemOrmEntity>,
  ) {}

  async findByUserId(userId: string): Promise<WatchlistItem[]> {
    const rows = await this.repository.find({
      where: { userId },
      order: { addedAt: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findByUserIdAndAsset(
    userId: string,
    assetSymbol: string,
    assetType: TrackedAssetType,
  ): Promise<WatchlistItem | null> {
    const row = await this.repository.findOne({
      where: { userId, assetSymbol, assetType },
    });
    return row ? this.toDomain(row) : null;
  }

  async create(newItem: NewWatchlistItemData): Promise<WatchlistItem> {
    const row = this.repository.create(newItem);
    const savedRow = await this.repository.save(row);
    return this.toDomain(savedRow);
  }

  async updateByIdAndUserId(
    id: string,
    userId: string,
    data: WatchlistItemAssetData,
  ): Promise<WatchlistItem | null> {
    const result = await this.repository.update(
      { id, userId },
      { assetSymbol: data.assetSymbol, assetType: data.assetType },
    );
    if ((result.affected ?? 0) === 0) {
      return null;
    }

    const row = await this.repository.findOne({ where: { id, userId } });
    return row ? this.toDomain(row) : null;
  }

  async deleteByIdAndUserId(id: string, userId: string): Promise<boolean> {
    const result = await this.repository.delete({ id, userId });
    return (result.affected ?? 0) > 0;
  }

  private toDomain(row: WatchlistItemOrmEntity): WatchlistItem {
    return new WatchlistItem(
      row.id,
      row.userId,
      row.assetSymbol,
      row.assetType,
      row.addedAt,
    );
  }
}
