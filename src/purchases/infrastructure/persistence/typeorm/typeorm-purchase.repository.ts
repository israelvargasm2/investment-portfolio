import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Money } from '../../../../shared/domain/value-objects/money.vo';
import { Purchase } from '../../../domain/entities/purchase.entity';
import {
  NewPurchaseData,
  PurchaseDetailsData,
  PurchaseRepositoryPort,
} from '../../../domain/ports/purchase-repository.port';
import { PurchaseOrmEntity } from './purchase.orm-entity';

/**
 * Adaptador de salida: implementa PurchaseRepositoryPort usando TypeORM sobre Postgres.
 */
@Injectable()
export class TypeOrmPurchaseRepository implements PurchaseRepositoryPort {
  constructor(
    @InjectRepository(PurchaseOrmEntity)
    private readonly repository: Repository<PurchaseOrmEntity>,
  ) {}

  async findByUserId(userId: string): Promise<Purchase[]> {
    const rows = await this.repository.find({
      where: { userId },
      order: { purchasedAt: 'DESC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async create(newPurchase: NewPurchaseData): Promise<Purchase> {
    const row = this.repository.create({
      userId: newPurchase.userId,
      assetSymbol: newPurchase.assetSymbol,
      assetType: newPurchase.assetType,
      quantity: newPurchase.quantity,
      purchasePriceAmount: newPurchase.purchasePrice.amount,
      purchasePriceCurrency: newPurchase.purchasePrice.currency,
      purchasedAt: newPurchase.purchasedAt,
    });
    const savedRow = await this.repository.save(row);
    return this.toDomain(savedRow);
  }

  async updateByIdAndUserId(
    id: string,
    userId: string,
    data: PurchaseDetailsData,
  ): Promise<Purchase | null> {
    const result = await this.repository.update(
      { id, userId },
      {
        assetSymbol: data.assetSymbol,
        assetType: data.assetType,
        quantity: data.quantity,
        purchasePriceAmount: data.purchasePrice.amount,
        purchasePriceCurrency: data.purchasePrice.currency,
        purchasedAt: data.purchasedAt,
      },
    );
    if ((result.affected ?? 0) === 0) {
      return null;
    }

    const row = await this.repository.findOne({ where: { id, userId } });
    return row ? this.toDomain(row) : null;
  }

  async deleteByIdAndUserId(id: string, userId: string): Promise<boolean> {
    const result = await this.repository.delete({ id, userId });
    return (result.affected ?? 0) > 0;
  }

  private toDomain(row: PurchaseOrmEntity): Purchase {
    return new Purchase(
      row.id,
      row.userId,
      row.assetSymbol,
      row.assetType,
      row.quantity,
      Money.of(row.purchasePriceAmount, row.purchasePriceCurrency),
      row.purchasedAt,
      row.createdAt,
    );
  }
}
