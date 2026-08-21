import { AssetType } from '../asset-type.enum';

export interface AssetOptionRecord {
  symbol: string;
  name: string;
  assetType: AssetType;
}

/**
 * Puerto de salida: catálogo de stocks/cripto disponibles para elegir en
 * watchlist/purchases. Hoy lo implementa un adaptador de Postgres; podría
 * cambiarse (u otro proceso podría re-poblarlo) sin tocar el caso de uso.
 */
export interface AssetOptionRepositoryPort {
  findAll(): Promise<AssetOptionRecord[]>;
  upsertMany(records: AssetOptionRecord[]): Promise<void>;
}

export const ASSET_OPTION_REPOSITORY = Symbol('ASSET_OPTION_REPOSITORY');
