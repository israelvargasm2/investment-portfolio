import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { CreateBalanceSnapshotUseCase } from './application/create-balance-snapshot/create-balance-snapshot.use-case';
import { ListBalanceSnapshotsUseCase } from './application/list-balance-snapshots/list-balance-snapshots.use-case';
import { RemoveBalanceSnapshotUseCase } from './application/remove-balance-snapshot/remove-balance-snapshot.use-case';
import { BALANCE_SNAPSHOT_REPOSITORY } from './domain/ports/balance-snapshot-repository.port';
import { BalanceSnapshotsController } from './infrastructure/http/balance-snapshots.controller';
import { BalanceSnapshotOrmEntity } from './infrastructure/persistence/typeorm/balance-snapshot.orm-entity';
import { TypeOrmBalanceSnapshotRepository } from './infrastructure/persistence/typeorm/typeorm-balance-snapshot.repository';

/**
 * Módulo del contexto "balance-snapshots": guarda y lista fotos históricas
 * del total (suma de todas las cuentas del usuario, convertidas a una sola
 * moneda) — depende de AccountsModule (ACCOUNT_REPOSITORY, para leer las
 * cuentas a sumar) y de MarketDataModule (CURRENCY_CONVERTER, para
 * convertir las que no estén ya en la moneda pedida). Sus rutas quedan
 * protegidas por el guard JWT global (ver AuthModule).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([BalanceSnapshotOrmEntity]),
    AccountsModule,
    MarketDataModule,
  ],
  controllers: [BalanceSnapshotsController],
  providers: [
    CreateBalanceSnapshotUseCase,
    ListBalanceSnapshotsUseCase,
    RemoveBalanceSnapshotUseCase,
    {
      provide: BALANCE_SNAPSHOT_REPOSITORY,
      useClass: TypeOrmBalanceSnapshotRepository,
    },
  ],
})
export class BalanceSnapshotsModule {}
