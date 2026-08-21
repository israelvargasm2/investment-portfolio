import { Inject, Injectable } from '@nestjs/common';
import { AssetType } from '../../domain/asset-type.enum';
import { AssetPrice } from '../../domain/entities/asset-price.entity';
import { AssetPriceLookupError } from '../../domain/errors/asset-price-lookup.error';
import { RateLimitExceededError } from '../../domain/errors/rate-limit-exceeded.error';
import { CRYPTO_PRICE_PROVIDER } from '../../domain/ports/crypto-price-provider.port';
import type { CryptoPriceProviderPort } from '../../domain/ports/crypto-price-provider.port';
import { CURRENCY_CONVERTER } from '../../domain/ports/currency-converter.port';
import type { CurrencyConverterPort } from '../../domain/ports/currency-converter.port';
import { STOCK_PRICE_PROVIDER } from '../../domain/ports/stock-price-provider.port';
import type { StockPriceProviderPort } from '../../domain/ports/stock-price-provider.port';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { GetAssetPricesRequest } from './get-asset-prices.request';
import { GetAssetPricesResult } from './get-asset-prices.result';

/**
 * Caso de uso: obtiene el precio actual de un conjunto de stocks y criptomonedas
 * expresado en la moneda solicitada. Cada activo se resuelve de forma independiente,
 * por lo que el fallo de uno no impide obtener el resto (respuesta parcial).
 */
@Injectable()
export class GetAssetPricesUseCase {
  constructor(
    @Inject(STOCK_PRICE_PROVIDER)
    private readonly stockPriceProvider: StockPriceProviderPort,
    @Inject(CRYPTO_PRICE_PROVIDER)
    private readonly cryptoPriceProvider: CryptoPriceProviderPort,
    @Inject(CURRENCY_CONVERTER)
    private readonly currencyConverter: CurrencyConverterPort,
  ) {}

  async execute(request: GetAssetPricesRequest): Promise<GetAssetPricesResult> {
    const targetCurrency = request.targetCurrency.toUpperCase();

    const settledResults = await Promise.allSettled([
      ...request.stockSymbols.map((symbol) =>
        this.resolveStockPrice(symbol, targetCurrency),
      ),
      ...request.cryptoIds.map((coinId) =>
        this.resolveCryptoPrice(coinId, targetCurrency),
      ),
    ]);

    return this.collectResults(settledResults);
  }

  private async resolveStockPrice(
    symbol: string,
    targetCurrency: string,
  ): Promise<AssetPrice> {
    try {
      const nativePrice = await this.stockPriceProvider.getPrice(symbol);
      const price = await this.convertIfNeeded(nativePrice, targetCurrency);
      return new AssetPrice(symbol, AssetType.STOCK, price, new Date());
    } catch (error) {
      throw new AssetPriceLookupError(
        symbol,
        AssetType.STOCK,
        this.messageFrom(error),
        error instanceof RateLimitExceededError,
      );
    }
  }

  private async resolveCryptoPrice(
    coinId: string,
    targetCurrency: string,
  ): Promise<AssetPrice> {
    try {
      const price = await this.cryptoPriceProvider.getPrice(
        coinId,
        targetCurrency,
      );
      return new AssetPrice(coinId, AssetType.CRYPTO, price, new Date());
    } catch (error) {
      throw new AssetPriceLookupError(
        coinId,
        AssetType.CRYPTO,
        this.messageFrom(error),
        error instanceof RateLimitExceededError,
      );
    }
  }

  private async convertIfNeeded(
    price: Money,
    targetCurrency: string,
  ): Promise<Money> {
    if (price.currency === targetCurrency) {
      return price;
    }

    const convertedAmount = await this.currencyConverter.convert(
      price.amount,
      price.currency,
      targetCurrency,
    );
    return Money.of(convertedAmount, targetCurrency);
  }

  private collectResults(
    settledResults: PromiseSettledResult<AssetPrice>[],
  ): GetAssetPricesResult {
    const prices: AssetPrice[] = [];
    const errors: AssetPriceLookupError[] = [];

    for (const result of settledResults) {
      if (result.status === 'fulfilled') {
        prices.push(result.value);
      } else {
        errors.push(result.reason as AssetPriceLookupError);
      }
    }

    return { prices, errors };
  }

  private messageFrom(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
