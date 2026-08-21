import { AssetType } from '../../../domain/asset-type.enum';
import { GetAssetPricesResult } from '../../../application/get-asset-prices/get-asset-prices.result';

export class AssetPriceItemDto {
  symbol: string;
  type: AssetType;
  price: number;
  currency: string;
  asOf: string;
}

export class AssetPriceErrorDto {
  symbol: string;
  type: AssetType;
  message: string;
  rateLimited: boolean;
}

export class AssetPricesResponseDto {
  currency: string;
  prices: AssetPriceItemDto[];
  errors: AssetPriceErrorDto[];

  static fromResult(
    currency: string,
    result: GetAssetPricesResult,
  ): AssetPricesResponseDto {
    const dto = new AssetPricesResponseDto();
    dto.currency = currency;
    dto.prices = result.prices.map((assetPrice) => ({
      symbol: assetPrice.assetSymbol,
      type: assetPrice.assetType,
      price: assetPrice.price.amount,
      currency: assetPrice.price.currency,
      asOf: assetPrice.asOf.toISOString(),
    }));
    dto.errors = result.errors.map((error) => ({
      symbol: error.assetSymbol,
      type: error.assetType,
      message: error.message,
      rateLimited: error.rateLimited,
    }));
    return dto;
  }
}
