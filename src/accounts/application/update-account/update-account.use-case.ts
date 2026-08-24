import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../../domain/entities/account.entity';
import { AccountNotFoundError } from '../../domain/errors/account-not-found.error';
import { ACCOUNT_REPOSITORY } from '../../domain/ports/account-repository.port';
import type {
  AccountDetailsData,
  AccountRepositoryPort,
} from '../../domain/ports/account-repository.port';
import { validateRateTiers } from '../../domain/rate-tier';

/**
 * Caso de uso: edita los datos de una cuenta ya registrada.
 */
@Injectable()
export class UpdateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async execute(
    id: string,
    userId: string,
    data: AccountDetailsData,
  ): Promise<Account> {
    validateRateTiers(data.rateTiers);

    const updatedAccount = await this.accountRepository.updateByIdAndUserId(
      id,
      userId,
      data,
    );
    if (!updatedAccount) {
      throw new AccountNotFoundError(id);
    }

    return updatedAccount;
  }
}
