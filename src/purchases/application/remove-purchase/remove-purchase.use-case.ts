import { Inject, Injectable } from '@nestjs/common';
import { PurchaseNotFoundError } from '../../domain/errors/purchase-not-found.error';
import { PURCHASE_REPOSITORY } from '../../domain/ports/purchase-repository.port';
import type { PurchaseRepositoryPort } from '../../domain/ports/purchase-repository.port';

/**
 * Caso de uso: elimina una compra registrada. Solo borra si pertenece al
 * usuario que lo pide.
 */
@Injectable()
export class RemovePurchaseUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly purchaseRepository: PurchaseRepositoryPort,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const wasDeleted = await this.purchaseRepository.deleteByIdAndUserId(
      id,
      userId,
    );
    if (!wasDeleted) {
      throw new PurchaseNotFoundError(id);
    }
  }
}
