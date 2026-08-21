import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { RefreshAssetOptionsUseCase } from '../application/refresh-asset-options/refresh-asset-options.use-case';

/**
 * Corre el refresh del catálogo de activos una sola vez, sin esperar al cron
 * de producción (útil en desarrollo, donde no hay un proceso corriendo
 * permanentemente para que el @Cron dispare solo).
 *
 * Uso: npm run refresh:asset-options
 */
const logger = new Logger('RefreshAssetOptionsScript');

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const refreshAssetOptions = app.get(RefreshAssetOptionsUseCase);
    const result = await refreshAssetOptions.execute();
    logger.log(
      `Asset options refreshed: ${result.stocksCount} stocks, ${result.cryptosCount} cryptos`,
    );
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? (error.stack ?? error.message) : String(error);
  logger.error(`Failed to refresh asset options: ${message}`);
  process.exitCode = 1;
});
