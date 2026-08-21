import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { MarketDataModule } from './market-data/market-data.module';
import { HealthController } from './shared/infrastructure/http/health.controller';
import { DatabaseModule } from './shared/infrastructure/persistence/typeorm/database.module';
import { PurchasesModule } from './purchases/purchases.module';
import { UsersModule } from './users/users.module';
import { WatchlistModule } from './watchlist/watchlist.module';

// Límite global por IP, defensa de base contra abuso (fuerza bruta, scraping)
// en cualquier endpoint. Los endpoints públicos que pegan a APIs externas
// pagas (login con Google, precios de assets) además tienen su propio
// `@Throttle` más estricto — ver auth.controller.ts / get-asset-prices.controller.ts.
const GLOBAL_THROTTLE_TTL_MS = 60_000;
const GLOBAL_THROTTLE_LIMIT = 100;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { ttl: GLOBAL_THROTTLE_TTL_MS, limit: GLOBAL_THROTTLE_LIMIT },
    ]),
    DatabaseModule,
    MarketDataModule,
    UsersModule,
    AuthModule,
    WatchlistModule,
    PurchasesModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
