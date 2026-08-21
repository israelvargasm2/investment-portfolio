import { Inject, Injectable } from '@nestjs/common';
import { ASSET_OPTION_REPOSITORY } from '../../domain/ports/asset-option-repository.port';
import type { AssetOptionRepositoryPort } from '../../domain/ports/asset-option-repository.port';
import { CRYPTO_CATALOG_PROVIDER } from '../../domain/ports/crypto-catalog-provider.port';
import type { CryptoCatalogProviderPort } from '../../domain/ports/crypto-catalog-provider.port';
import { STOCK_CATALOG_PROVIDER } from '../../domain/ports/stock-catalog-provider.port';
import type { StockCatalogProviderPort } from '../../domain/ports/stock-catalog-provider.port';
import { buildBmvSicMirrors } from './bmv-sic-mirrors';
import { BMV_STOCK_CATALOG } from './bmv-stock-catalog.constants';

export interface RefreshAssetOptionsResult {
  stocksCount: number;
  cryptosCount: number;
}

/**
 * Caso de uso: repuebla "asset_options" (upsert, no borra lo existente) con:
 * - Stocks de EE.UU.: TODO el listado de Finnhub, sin tope (miles).
 * - Stocks de la BMV: lista curada a mano (Finnhub free no cubre esa bolsa),
 *   más los espejos SIC generados a partir del propio listado de EE.UU. (ver
 *   bmv-sic-mirrors.ts — "QQQ*", "AAPL*", etc., el mismo ticker en pesos).
 * - Criptos: TODAS las que trackea CoinGecko, sin tope (ver
 *   CoinGeckoCryptoCatalogAdapter — antes se pedía solo el top 100 por market
 *   cap, se sacó el tope a pedido).
 * Pensado para correr por cron (producción) o a demanda (ver
 * scripts/refresh-asset-options.script.ts para desarrollo).
 */
@Injectable()
export class RefreshAssetOptionsUseCase {
  constructor(
    @Inject(ASSET_OPTION_REPOSITORY)
    private readonly assetOptionRepository: AssetOptionRepositoryPort,
    @Inject(CRYPTO_CATALOG_PROVIDER)
    private readonly cryptoCatalogProvider: CryptoCatalogProviderPort,
    @Inject(STOCK_CATALOG_PROVIDER)
    private readonly stockCatalogProvider: StockCatalogProviderPort,
  ) {}

  async execute(): Promise<RefreshAssetOptionsResult> {
    const [usStocks, cryptos] = await Promise.all([
      this.stockCatalogProvider.fetchAll(),
      this.cryptoCatalogProvider.fetchAll(),
    ]);
    const bmvSicMirrors = buildBmvSicMirrors(usStocks);
    const stocks = [...usStocks, ...BMV_STOCK_CATALOG, ...bmvSicMirrors];

    await this.assetOptionRepository.upsertMany([...stocks, ...cryptos]);

    return { stocksCount: stocks.length, cryptosCount: cryptos.length };
  }
}
