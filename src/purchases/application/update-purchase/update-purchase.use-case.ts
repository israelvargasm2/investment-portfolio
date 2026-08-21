import { Inject, Injectable } from '@nestjs/common';
import { Purchase } from '../../domain/entities/purchase.entity';
import { InvalidPurchaseDateError } from '../../domain/errors/invalid-purchase-date.error';
import { PurchaseNotFoundError } from '../../domain/errors/purchase-not-found.error';
import { PURCHASE_REPOSITORY } from '../../domain/ports/purchase-repository.port';
import type {
  PurchaseDetailsData,
  PurchaseRepositoryPort,
} from '../../domain/ports/purchase-repository.port';

/**
 * Caso de uso: edita los datos de una compra ya registrada. Misma regla que
 * al crear: no se permite una fecha de compra futura.
 */
@Injectable()
export class UpdatePurchaseUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly purchaseRepository: PurchaseRepositoryPort,
  ) {}

  async execute(
    id: string,
    userId: string,
    data: PurchaseDetailsData,
  ): Promise<Purchase> {
    if (data.purchasedAt.getTime() > Date.now()) {
      throw new InvalidPurchaseDateError('purchasedAt cannot be in the future');
    }

    const updatedPurchase = await this.purchaseRepository.updateByIdAndUserId(
      id,
      userId,
      data,
    );
    if (!updatedPurchase) {
      throw new PurchaseNotFoundError(id);
    }

    return updatedPurchase;
  }
}
