import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../../../accounts/domain/entities/account.entity';
import { AccountTerm } from '../../../accounts/domain/account-term.enum';
import { ACCOUNT_REPOSITORY } from '../../../accounts/domain/ports/account-repository.port';
import type { AccountRepositoryPort } from '../../../accounts/domain/ports/account-repository.port';
import { CURRENCY_CONVERTER } from '../../../market-data/domain/ports/currency-converter.port';
import type { CurrencyConverterPort } from '../../../market-data/domain/ports/currency-converter.port';
import { GetPurchasesPerformanceUseCase } from '../../../purchases/application/get-purchases-performance/get-purchases-performance.use-case';
import { DISPLAY_CURRENCY as PURCHASES_CURRENCY } from '../../../purchases/application/get-purchases-performance/purchase-performance';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { BalanceSnapshot } from '../../domain/entities/balance-snapshot.entity';
import { BalanceSnapshotCalculationError } from '../../domain/errors/balance-snapshot-calculation.error';
import { BALANCE_SNAPSHOT_REPOSITORY } from '../../domain/ports/balance-snapshot-repository.port';
import type { BalanceSnapshotRepositoryPort } from '../../domain/ports/balance-snapshot-repository.port';

interface AmountInCurrency {
  amount: number;
  currency: string;
}

/**
 * Caso de uso: guarda, en UN SOLO registro, una "foto" con el total actual
 * del usuario y su desglose por plazo — total, largo+mediano plazo junto, y
 * corto plazo — todo en una sola moneda, para armar un histórico en el
 * tiempo con un solo click en "Guardar total actual" (antes guardaba tres
 * filas sueltas, una por subconjunto; ver el comentario en la entidad).
 * Stocks/cripto se consideran "largo plazo" (mismo criterio que
 * holding-accounts.ts del frontend, que arma las filas "Stocks"/"Crypto" de
 * la tabla), así que van dentro del monto de largo+mediano, nunca en el de
 * corto plazo. El total se RECALCULA acá a partir de datos reales, no se
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
    private readonly getPurchasesPerformance: GetPurchasesPerformanceUseCase,
    @Inject(CURRENCY_CONVERTER)
    private readonly currencyConverter: CurrencyConverterPort,
    @Inject(BALANCE_SNAPSHOT_REPOSITORY)
    private readonly snapshotRepository: BalanceSnapshotRepositoryPort,
  ) {}

  async execute(userId: string, currency: string): Promise<BalanceSnapshot> {
    const targetCurrency = currency.toUpperCase();
    const accounts = await this.accountRepository.findByUserId(userId);
    const shortAccounts = accounts.filter(
      (account) => account.term === AccountTerm.SHORT,
    );
    const longMediumAccounts = accounts.filter(
      (account) => account.term !== AccountTerm.SHORT,
    );
    const holdingsAmount = await this.computeHoldingsAmount(userId);

    const [shortTotal, longMediumTotal] = await Promise.all([
      this.computeTotal(this.toAmounts(shortAccounts), targetCurrency),
      this.computeTotal(
        [
          ...this.toAmounts(longMediumAccounts),
          { amount: holdingsAmount, currency: PURCHASES_CURRENCY },
        ],
        targetCurrency,
      ),
    ]);

    return this.snapshotRepository.create({
      userId,
      totalAmount: Money.of(shortTotal + longMediumTotal, targetCurrency),
      longMediumTermAmount: Money.of(longMediumTotal, targetCurrency),
      shortTermAmount: Money.of(shortTotal, targetCurrency),
    });
  }

  private toAmounts(accounts: Account[]): AmountInCurrency[] {
    return accounts.map((account) => ({
      amount: account.balance.amount,
      currency: account.balance.currency,
    }));
  }

  // GetPurchasesPerformanceUseCase ya devuelve currentValue en
  // PURCHASES_CURRENCY (USD) para stocks y cripto por igual — acá solo se
  // suman, la conversión a la moneda pedida pasa después, en computeTotal.
  private async computeHoldingsAmount(userId: string): Promise<number> {
    const { performances } = await this.getPurchasesPerformance.execute(userId);
    return performances.reduce(
      (sum, performance) => sum + performance.currentValue,
      0,
    );
  }

  private async computeTotal(
    amounts: AmountInCurrency[],
    targetCurrency: string,
  ): Promise<number> {
    try {
      const converted = await Promise.all(
        amounts.map((entry) =>
          this.convertToTarget(entry.amount, entry.currency, targetCurrency),
        ),
      );
      return converted.reduce((sum, amount) => sum + amount, 0);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BalanceSnapshotCalculationError(
        `Could not calculate the total balance in ${targetCurrency}: ${message}`,
      );
    }
  }

  private async convertToTarget(
    amount: number,
    sourceCurrency: string,
    targetCurrency: string,
  ): Promise<number> {
    if (sourceCurrency === targetCurrency) {
      return amount;
    }
    return this.currencyConverter.convert(
      amount,
      sourceCurrency,
      targetCurrency,
    );
  }
}
