import { Money } from '../../../shared/domain/value-objects/money.vo';
import { Purchase } from '../entities/purchase.entity';
import { PurchaseAssetType } from '../purchase-asset-type.enum';

export interface NewPurchaseData {
  userId: string;
  assetSymbol: string;
  assetType: PurchaseAssetType;
  quantity: number;
  purchasePrice: Money;
  purchasedAt: Date;
}

export interface PurchaseDetailsData {
  assetSymbol: string;
  assetType: PurchaseAssetType;
  quantity: number;
  purchasePrice: Money;
  purchasedAt: Date;
}

/**
 * Puerto de salida: persistencia de compras. Cualquier motor de base de datos
 * se conecta implementando esta interfaz.
 */
export interface PurchaseRepositoryPort {
  findByUserId(userId: string): Promise<Purchase[]>;
  create(newPurchase: NewPurchaseData): Promise<Purchase>;
  updateByIdAndUserId(
    id: string,
    userId: string,
    data: PurchaseDetailsData,
  ): Promise<Purchase | null>;
  deleteByIdAndUserId(id: string, userId: string): Promise<boolean>;
}

export const PURCHASE_REPOSITORY = Symbol('PURCHASE_REPOSITORY');
