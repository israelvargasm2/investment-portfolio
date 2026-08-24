import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetAssetPricesUseCase } from './application/get-asset-prices/get-asset-prices.use-case';
import { GetExchangeRateUseCase } from './application/get-exchange-rate/get-exchange-rate.use-case';
import { ListAssetOptionsUseCase } from './application/list-asset-options/list-asset-options.use-case';
import { RefreshAssetOptionsUseCase } from './application/refresh-asset-options/refresh-asset-options.use-case';
import { ASSET_OPTION_REPOSITORY } from './domain/ports/asset-option-repository.port';
import { CRYPTO_CATALOG_PROVIDER } from './domain/ports/crypto-catalog-provider.port';
import { CRYPTO_PRICE_PROVIDER } from './domain/ports/crypto-price-provider.port';
import { CURRENCY_CONVERTER } from './domain/ports/currency-converter.port';
import { STOCK_CATALOG_PROVIDER } from './domain/ports/stock-catalog-provider.port';
import { STOCK_PRICE_PROVIDER } from './domain/ports/stock-price-provider.port';
import { GetAssetPricesController } from './infrastructure/http/get-asset-prices.controller';
import { GetExchangeRateController } from './infrastructure/http/get-exchange-rate.controller';
import { ListAssetOptionsController } from './infrastructure/http/list-asset-options.controller';
import { AssetOptionOrmEntity } from './infrastructure/persistence/typeorm/asset-option.orm-entity';
import { TypeOrmAssetOptionRepository } from './infrastructure/persistence/typeorm/typeorm-asset-option.repository';
import { CachingCryptoPriceProviderAdapter } from './infrastructure/providers/caching/caching-crypto-price.adapter';
import { CachingCurrencyConverterAdapter } from './infrastructure/providers/caching/caching-currency-converter.adapter';
import { CachingStockPriceProviderAdapter } from './infrastructure/providers/caching/caching-stock-price.adapter';
import { CoinGeckoCryptoCatalogAdapter } from './infrastructure/providers/coingecko/coingecko-crypto-catalog.adapter';
import { CoinGeckoCryptoPriceAdapter } from './infrastructure/providers/coingecko/coingecko-crypto-price.adapter';
import { FinnhubStockCatalogAdapter } from './infrastructure/providers/finnhub/finnhub-stock-catalog.adapter';
import { FinnhubStockPriceAdapter } from './infrastructure/providers/finnhub/finnhub-stock-price.adapter';
import { FrankfurterCurrencyConverterAdapter } from './infrastructure/providers/frankfurter/frankfurter-currency-converter.adapter';
import { RoutedStockPriceAdapter } from './infrastructure/providers/routed-stock-price.adapter';
import { YahooFinanceStockPriceAdapter } from './infrastructure/providers/yahoo-finance/yahoo-finance-stock-price.adapter';
import { AssetOptionsRefreshScheduler } from './infrastructure/scheduling/asset-options-refresh.scheduler';

/**
 * Módulo del contexto "market-data": expone precios actuales de stocks y
 * criptomonedas, y el catálogo de activos disponibles (tabla "asset_options",
 * refrescado por AssetOptionsRefreshScheduler). La capa de aplicación depende
 * únicamente de los puertos de dominio; aquí se conecta cada puerto con su
 * adaptador concreto de infraestructura.
 */
@Module({
  imports: [TypeOrmModule.forFeature([AssetOptionOrmEntity])],
  controllers: [
    GetAssetPricesController,
    GetExchangeRateController,
    ListAssetOptionsController,
  ],
  providers: [
    GetAssetPricesUseCase,
    GetExchangeRateUseCase,
    ListAssetOptionsUseCase,
    RefreshAssetOptionsUseCase,
    AssetOptionsRefreshScheduler,
    FinnhubStockPriceAdapter,
    YahooFinanceStockPriceAdapter,
    RoutedStockPriceAdapter,
    CoinGeckoCryptoPriceAdapter,
    FrankfurterCurrencyConverterAdapter,
    // STOCK_PRICE_PROVIDER/CRYPTO_PRICE_PROVIDER/CURRENCY_CONVERTER quedan
    // envueltos en un decorador de caching (ver infrastructure/providers/caching/):
    // GetAssetPricesUseCase y GetPurchasesPerformanceUseCase siguen viendo el
    // mismo puerto, sin saber que hay un cache de por medio. Reduce llamadas
    // repetidas a Finnhub/Yahoo Finance/CoinGecko/Frankfurter entre pedidos
    // cercanos (recargas de /purchases, /purchases/charts, validación de
    // símbolo) sin tocar los adaptadores reales ni los casos de uso.
    {
      provide: STOCK_PRICE_PROVIDER,
      useFactory: (delegate: RoutedStockPriceAdapter) =>
        new CachingStockPriceProviderAdapter(delegate),
      inject: [RoutedStockPriceAdapter],
    },
    {
      provide: CRYPTO_PRICE_PROVIDER,
      useFactory: (delegate: CoinGeckoCryptoPriceAdapter) =>
        new CachingCryptoPriceProviderAdapter(delegate),
      inject: [CoinGeckoCryptoPriceAdapter],
    },
    {
      provide: CURRENCY_CONVERTER,
      useFactory: (delegate: FrankfurterCurrencyConverterAdapter) =>
        new CachingCurrencyConverterAdapter(delegate),
      inject: [FrankfurterCurrencyConverterAdapter],
    },
    {
      provide: ASSET_OPTION_REPOSITORY,
      useClass: TypeOrmAssetOptionRepository,
    },
    {
      provide: CRYPTO_CATALOG_PROVIDER,
      useClass: CoinGeckoCryptoCatalogAdapter,
    },
    {
      provide: STOCK_CATALOG_PROVIDER,
      useClass: FinnhubStockCatalogAdapter,
    },
  ],
  exports: [GetAssetPricesUseCase, CURRENCY_CONVERTER],
})
export class MarketDataModule {}
