import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketDataModule } from '../market-data/market-data.module';
import { CreatePurchaseUseCase } from './application/create-purchase/create-purchase.use-case';
import { GetPurchasesPerformanceUseCase } from './application/get-purchases-performance/get-purchases-performance.use-case';
import { RemovePurchaseUseCase } from './application/remove-purchase/remove-purchase.use-case';
import { UpdatePurchaseUseCase } from './application/update-purchase/update-purchase.use-case';
import { PURCHASE_REPOSITORY } from './domain/ports/purchase-repository.port';
import { PurchasesController } from './infrastructure/http/purchases.controller';
import { PurchaseOrmEntity } from './infrastructure/persistence/typeorm/purchase.orm-entity';
import { TypeOrmPurchaseRepository } from './infrastructure/persistence/typeorm/typeorm-purchase.repository';

/**
 * Módulo del contexto "purchases": registra compras y calcula ganancia/pérdida
 * contra el precio actual. Sus rutas quedan protegidas por el guard JWT
 * global (ver AuthModule). Depende de MarketDataModule (GetAssetPricesUseCase)
 * sin conocer sus detalles internos.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PurchaseOrmEntity]), MarketDataModule],
  controllers: [PurchasesController],
  providers: [
    CreatePurchaseUseCase,
    GetPurchasesPerformanceUseCase,
    UpdatePurchaseUseCase,
    RemovePurchaseUseCase,
    { provide: PURCHASE_REPOSITORY, useClass: TypeOrmPurchaseRepository },
  ],
  // GetPurchasesPerformanceUseCase también lo usa BalanceSnapshotsModule
  // (para incluir el valor de stocks/cripto en el total de largo plazo).
  exports: [GetPurchasesPerformanceUseCase],
})
export class PurchasesModule {}
