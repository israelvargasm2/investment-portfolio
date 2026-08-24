import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../../domain/entities/account.entity';
import { ACCOUNT_REPOSITORY } from '../../domain/ports/account-repository.port';
import type {
  AccountRepositoryPort,
  NewAccountData,
} from '../../domain/ports/account-repository.port';
import { validateRateTiers } from '../../domain/rate-tier';

/**
 * Caso de uso: registra una cuenta (banco, SOFIPO, etc.) para el usuario.
 */
@Injectable()
export class CreateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async execute(newAccount: NewAccountData): Promise<Account> {
    validateRateTiers(newAccount.rateTiers);
    return this.accountRepository.create(newAccount);
  }
}
