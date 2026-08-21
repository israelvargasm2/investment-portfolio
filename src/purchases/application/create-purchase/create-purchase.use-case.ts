import { Inject, Injectable } from '@nestjs/common';
import { Purchase } from '../../domain/entities/purchase.entity';
import { InvalidPurchaseDateError } from '../../domain/errors/invalid-purchase-date.error';
import { PURCHASE_REPOSITORY } from '../../domain/ports/purchase-repository.port';
import type {
  NewPurchaseData,
  PurchaseRepositoryPort,
} from '../../domain/ports/purchase-repository.port';

/**
 * Caso de uso: registra una compra. No se permite registrar compras "futuras"
 * (la fecha de compra no puede ser posterior a ahora).
 */
@Injectable()
export class CreatePurchaseUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly purchaseRepository: PurchaseRepositoryPort,
  ) {}

  async execute(newPurchase: NewPurchaseData): Promise<Purchase> {
    if (newPurchase.purchasedAt.getTime() > Date.now()) {
      throw new InvalidPurchaseDateError('purchasedAt cannot be in the future');
    }

    return this.purchaseRepository.create(newPurchase);
  }
}
