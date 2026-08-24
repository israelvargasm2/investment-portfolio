import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../../domain/entities/account.entity';
import { ACCOUNT_REPOSITORY } from '../../domain/ports/account-repository.port';
import type { AccountRepositoryPort } from '../../domain/ports/account-repository.port';

/**
 * Caso de uso: lista las cuentas del usuario. A diferencia de
 * GetPurchasesPerformanceUseCase/GetWatchlistWithPricesUseCase, no depende de
 * ningún precio de mercado (no hay nada que cotice acá), así que no hace
 * falta combinar con market-data ni manejar una lista de `errors` parcial.
 */
@Injectable()
export class ListAccountsUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async execute(userId: string): Promise<Account[]> {
    return this.accountRepository.findByUserId(userId);
  }
}
