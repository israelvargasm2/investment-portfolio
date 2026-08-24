import { Inject, Injectable } from '@nestjs/common';
import { AccountNotFoundError } from '../../domain/errors/account-not-found.error';
import { ACCOUNT_REPOSITORY } from '../../domain/ports/account-repository.port';
import type { AccountRepositoryPort } from '../../domain/ports/account-repository.port';

/**
 * Caso de uso: elimina una cuenta registrada. Solo borra si pertenece al
 * usuario que lo pide.
 */
@Injectable()
export class RemoveAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const wasDeleted = await this.accountRepository.deleteByIdAndUserId(
      id,
      userId,
    );
    if (!wasDeleted) {
      throw new AccountNotFoundError(id);
    }
  }
}
