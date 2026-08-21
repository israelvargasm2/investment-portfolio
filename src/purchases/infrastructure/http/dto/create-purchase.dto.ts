import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsPositive,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { PurchaseAssetType } from '../../../domain/purchase-asset-type.enum';

export class CreatePurchaseDto {
  @IsString()
  @IsNotEmpty()
  assetSymbol: string;

  @IsEnum(PurchaseAssetType)
  assetType: PurchaseAssetType;

  @IsPositive()
  quantity: number;

  @Min(0)
  purchasePriceAmount: number;

  @Matches(/^[A-Za-z]{3}$/, {
    message: 'currency must be a 3-letter ISO 4217 code',
  })
  currency: string;

  @IsISO8601()
  purchasedAt: string;
}
