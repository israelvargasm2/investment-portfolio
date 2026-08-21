import { Inject, Injectable } from '@nestjs/common';
import { AssetOption } from '../../domain/asset-option';
import { AssetType } from '../../domain/asset-type.enum';
import { ASSET_OPTION_REPOSITORY } from '../../domain/ports/asset-option-repository.port';
import type { AssetOptionRepositoryPort } from '../../domain/ports/asset-option-repository.port';

export interface AssetOptionsResult {
  stocks: AssetOption[];
  cryptos: AssetOption[];
}

/**
 * Caso de uso: devuelve la lista de stocks y criptos disponibles para elegir
 * en watchlist/purchases. El catálogo vive en la base de datos (tabla
 * "asset_options", ver migration) en vez de hardcodeado, para poder
 * actualizarlo sin un deploy; a futuro un job puede repoblarla periódicamente.
 */
@Injectable()
export class ListAssetOptionsUseCase {
  constructor(
    @Inject(ASSET_OPTION_REPOSITORY)
    private readonly assetOptionRepository: AssetOptionRepositoryPort,
  ) {}

  async execute(): Promise<AssetOptionsResult> {
    const records = await this.assetOptionRepository.findAll();

    return {
      stocks: this.mapByType(records, AssetType.STOCK),
      cryptos: this.mapByType(records, AssetType.CRYPTO),
    };
  }

  private mapByType(
    records: { symbol: string; name: string; assetType: AssetType }[],
    assetType: AssetType,
  ): AssetOption[] {
    return records
      .filter((record) => record.assetType === assetType)
      .map((record) => ({ symbol: record.symbol, name: record.name }));
  }
}
