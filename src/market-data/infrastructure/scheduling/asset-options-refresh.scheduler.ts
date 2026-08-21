import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RefreshAssetOptionsUseCase } from '../../application/refresh-asset-options/refresh-asset-options.use-case';

/**
 * Refresca "asset_options" una vez por día (producción). Para probarlo en
 * desarrollo sin esperar al cron, correr `npm run refresh:asset-options`
 * (ver src/market-data/scripts/refresh-asset-options.script.ts).
 */
@Injectable()
export class AssetOptionsRefreshScheduler {
  private readonly logger = new Logger(AssetOptionsRefreshScheduler.name);

  constructor(
    private readonly refreshAssetOptions: RefreshAssetOptionsUseCase,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCron(): Promise<void> {
    try {
      const result = await this.refreshAssetOptions.execute();
      this.logger.log(
        `Asset options refreshed: ${result.stocksCount} stocks, ${result.cryptosCount} cryptos`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to refresh asset options: ${message}`);
    }
  }
}
