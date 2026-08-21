import { Money } from '../../../shared/domain/value-objects/money.vo';
import { PurchaseAssetType } from '../purchase-asset-type.enum';

/**
 * Entidad de dominio: una compra registrada por el usuario para un activo
 * (stock o cripto), usada para calcular ganancia/pérdida contra el precio actual.
 */
export class Purchase {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly assetSymbol: string,
    public readonly assetType: PurchaseAssetType,
    public readonly quantity: number,
    public readonly purchasePrice: Money,
    public readonly purchasedAt: Date,
    public readonly createdAt: Date,
  ) {}
}
