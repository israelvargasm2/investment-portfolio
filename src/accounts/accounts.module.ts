import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateAccountUseCase } from './application/create-account/create-account.use-case';
import { ListAccountsUseCase } from './application/list-accounts/list-accounts.use-case';
import { RemoveAccountUseCase } from './application/remove-account/remove-account.use-case';
import { UpdateAccountUseCase } from './application/update-account/update-account.use-case';
import { ACCOUNT_REPOSITORY } from './domain/ports/account-repository.port';
import { AccountsController } from './infrastructure/http/accounts.controller';
import { AccountOrmEntity } from './infrastructure/persistence/typeorm/account.orm-entity';
import { TypeOrmAccountRepository } from './infrastructure/persistence/typeorm/typeorm-account.repository';

/**
 * Módulo del contexto "accounts": cuentas (banco, SOFIPO, etc.) donde el
 * usuario tiene dinero guardado, con la tasa anual que le paga cada
 * institución. A diferencia de purchases/watchlist, no depende de
 * MarketDataModule: no hay ningún precio de mercado que consultar, todo el
 * cálculo (`estimatedAnnualYield`) sale de los propios campos de la cuenta.
 * Sus rutas quedan protegidas por el guard JWT global (ver AuthModule).
 *
 * Exporta ACCOUNT_REPOSITORY para que BalanceSnapshotsModule pueda sumar el
 * balance de todas las cuentas del usuario al guardar una foto histórica,
 * sin duplicar la persistencia de cuentas ahí.
 */
@Module({
  imports: [TypeOrmModule.forFeature([AccountOrmEntity])],
  controllers: [AccountsController],
  providers: [
    CreateAccountUseCase,
    ListAccountsUseCase,
    UpdateAccountUseCase,
    RemoveAccountUseCase,
    { provide: ACCOUNT_REPOSITORY, useClass: TypeOrmAccountRepository },
  ],
  exports: [ACCOUNT_REPOSITORY],
})
export class AccountsModule {}
