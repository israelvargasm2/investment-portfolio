import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../../../accounts/domain/entities/account.entity';
import { ACCOUNT_REPOSITORY } from '../../../accounts/domain/ports/account-repository.port';
import type { AccountRepositoryPort } from '../../../accounts/domain/ports/account-repository.port';
import { CURRENCY_CONVERTER } from '../../../market-data/domain/ports/currency-converter.port';
import type { CurrencyConverterPort } from '../../../market-data/domain/ports/currency-converter.port';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { BalanceSnapshot } from '../../domain/entities/balance-snapshot.entity';
import { BalanceSnapshotCalculationError } from '../../domain/errors/balance-snapshot-calculation.error';
import { BALANCE_SNAPSHOT_REPOSITORY } from '../../domain/ports/balance-snapshot-repository.port';
import type { BalanceSnapshotRepositoryPort } from '../../domain/ports/balance-snapshot-repository.port';

/**
 * Caso de uso: guarda una "foto" del total actual (suma de todas las cuentas
 * del usuario, convertidas a una sola moneda) para armar un histórico en el
 * tiempo. El total se RECALCULA acá a partir de las cuentas reales, no se
 * recibe del cliente: así el número guardado siempre refleja lo que el
 * backend puede verificar, no lo que el frontend haya calculado (o mal
 * calculado con monedas mezcladas — CurrencyConverterPort convierte
 * cualquier par que soporte Frankfurter, no solo USD/MXN).
 */
@Injectable()
export class CreateBalanceSnapshotUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(CURRENCY_CONVERTER)
    private readonly currencyConverter: CurrencyConverterPort,
    @Inject(BALANCE_SNAPSHOT_REPOSITORY)
    private readonly snapshotRepository: BalanceSnapshotRepositoryPort,
  ) {}

  async execute(userId: string, currency: string): Promise<BalanceSnapshot> {
    const targetCurrency = currency.toUpperCase();
    const accounts = await this.accountRepository.findByUserId(userId);
    const totalAmount = await this.computeTotal(accounts, targetCurrency);

    return this.snapshotRepository.create({
      userId,
      total: Money.of(totalAmount, targetCurrency),
    });
  }

  private async computeTotal(
    accounts: Account[],
    targetCurrency: string,
  ): Promise<number> {
    try {
      const amounts = await Promise.all(
        accounts.map((account) =>
          this.convertToTarget(account, targetCurrency),
        ),
      );
      return amounts.reduce((sum, amount) => sum + amount, 0);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BalanceSnapshotCalculationError(
        `Could not calculate the total balance in ${targetCurrency}: ${message}`,
      );
    }
  }

  private async convertToTarget(
    account: Account,
    targetCurrency: string,
  ): Promise<number> {
    if (account.balance.currency === targetCurrency) {
      return account.balance.amount;
    }
    return this.currencyConverter.convert(
      account.balance.amount,
      account.balance.currency,
      targetCurrency,
    );
  }
}
