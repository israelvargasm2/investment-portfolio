import { AssetType } from '../asset-type.enum';
import { Money } from '../../../shared/domain/value-objects/money.vo';

/**
 * Representa el precio actual de un activo (stock o cripto) en un momento dado.
 */
export class AssetPrice {
  constructor(
    public readonly assetSymbol: string,
    public readonly assetType: AssetType,
    public readonly price: Money,
    public readonly asOf: Date,
  ) {}
}
