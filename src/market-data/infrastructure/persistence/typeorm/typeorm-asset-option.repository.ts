import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AssetOptionRecord,
  AssetOptionRepositoryPort,
} from '../../../domain/ports/asset-option-repository.port';
import { AssetOptionOrmEntity } from './asset-option.orm-entity';

// Postgres tiene un límite duro de 65535 parámetros por query. Con 3 columnas
// por fila, 1000 filas por tanda son 3000 params (bien por debajo del límite,
// con margen). El catálogo sin tope (todo el listado de Finnhub + CoinGecko)
// puede rondar las decenas de miles de filas, así que hace falta trocear.
const UPSERT_BATCH_SIZE = 1000;

/**
 * Adaptador de salida: implementa AssetOptionRepositoryPort usando TypeORM sobre Postgres.
 */
@Injectable()
export class TypeOrmAssetOptionRepository implements AssetOptionRepositoryPort {
  constructor(
    @InjectRepository(AssetOptionOrmEntity)
    private readonly repository: Repository<AssetOptionOrmEntity>,
  ) {}

  async findAll(): Promise<AssetOptionRecord[]> {
    const rows = await this.repository.find({ order: { name: 'ASC' } });
    return rows.map((row) => ({
      symbol: row.symbol,
      name: row.name,
      assetType: row.assetType,
    }));
  }

  async upsertMany(records: AssetOptionRecord[]): Promise<void> {
    for (const batch of this.chunk(records, UPSERT_BATCH_SIZE)) {
      await this.repository.upsert(batch, {
        conflictPaths: ['symbol', 'assetType'],
      });
    }
  }

  private chunk<T>(items: T[], size: number): T[][] {
    const batches: T[][] = [];
    for (let offset = 0; offset < items.length; offset += size) {
      batches.push(items.slice(offset, offset + size));
    }
    return batches;
  }
}
