import { Purchase } from '../../../domain/entities/purchase.entity';
import { PurchaseAssetType } from '../../../domain/purchase-asset-type.enum';

export class PurchaseResponseDto {
  id: string;
  assetSymbol: string;
  assetType: PurchaseAssetType;
  quantity: number;
  purchasePriceAmount: number;
  currency: string;
  purchasedAt: string;

  static fromDomain(purchase: Purchase): PurchaseResponseDto {
    const dto = new PurchaseResponseDto();
    dto.id = purchase.id;
    dto.assetSymbol = purchase.assetSymbol;
    dto.assetType = purchase.assetType;
    dto.quantity = purchase.quantity;
    dto.purchasePriceAmount = purchase.purchasePrice.amount;
    dto.currency = purchase.purchasePrice.currency;
    dto.purchasedAt = purchase.purchasedAt.toISOString();
    return dto;
  }
}
