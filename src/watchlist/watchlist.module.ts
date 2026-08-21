import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketDataModule } from '../market-data/market-data.module';
import { AddWatchlistItemUseCase } from './application/add-watchlist-item/add-watchlist-item.use-case';
import { GetWatchlistWithPricesUseCase } from './application/get-watchlist-with-prices/get-watchlist-with-prices.use-case';
import { RemoveWatchlistItemUseCase } from './application/remove-watchlist-item/remove-watchlist-item.use-case';
import { UpdateWatchlistItemUseCase } from './application/update-watchlist-item/update-watchlist-item.use-case';
import { WATCHLIST_REPOSITORY } from './domain/ports/watchlist-repository.port';
import { WatchlistController } from './infrastructure/http/watchlist.controller';
import { TypeOrmWatchlistRepository } from './infrastructure/persistence/typeorm/typeorm-watchlist.repository';
import { WatchlistItemOrmEntity } from './infrastructure/persistence/typeorm/watchlist-item.orm-entity';

/**
 * Módulo del contexto "watchlist". Sus rutas quedan protegidas por el guard
 * JWT global (ver AuthModule), no depende de importarlo acá. Importa
 * MarketDataModule para reusar GetAssetPricesUseCase (igual que PurchasesModule).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([WatchlistItemOrmEntity]),
    MarketDataModule,
  ],
  controllers: [WatchlistController],
  providers: [
    AddWatchlistItemUseCase,
    GetWatchlistWithPricesUseCase,
    UpdateWatchlistItemUseCase,
    RemoveWatchlistItemUseCase,
    { provide: WATCHLIST_REPOSITORY, useClass: TypeOrmWatchlistRepository },
  ],
})
export class WatchlistModule {}
