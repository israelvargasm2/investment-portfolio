import { AssetPrice } from '../../domain/entities/asset-price.entity';
import { AssetPriceLookupError } from '../../domain/errors/asset-price-lookup.error';

export interface GetAssetPricesResult {
  prices: AssetPrice[];
  errors: AssetPriceLookupError[];
}
