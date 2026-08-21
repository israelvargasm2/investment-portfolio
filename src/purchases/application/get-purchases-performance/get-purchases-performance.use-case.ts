import { Injectable, Inject } from '@nestjs/common';
import { GetAssetPricesUseCase } from '../../../market-data/application/get-asset-prices/get-asset-prices.use-case';
import { CURRENCY_CONVERTER } from '../../../market-data/domain/ports/currency-converter.port';
import type { CurrencyConverterPort } from '../../../market-data/domain/ports/currency-converter.port';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { Purchase } from '../../domain/entities/purchase.entity';
import { PURCHASE_REPOSITORY } from '../../domain/ports/purchase-repository.port';
import type { PurchaseRepositoryPort } from '../../domain/ports/purchase-repository.port';
import { PurchaseAssetType } from '../../domain/purchase-asset-type.enum';
import {
  DISPLAY_CURRENCY,
  GetPurchasesPerformanceResult,
  PurchasePerformance,
  PurchasePerformanceError,
} from './purchase-performance';

/**
 * Caso de uso: calcula ganancia/pérdida de cada compra comparando el precio
 * pagado contra el precio actual (reusa GetAssetPricesUseCase de market-data).
 *
 * Todo se expresa en DISPLAY_CURRENCY (USD) sin importar la moneda en la que
 * se cargó la compra (ej. una stock de la BMV cargada en MXN): el precio
 * actual se pide directamente en USD, y el monto invertido se convierte con
 * CurrencyConverterPort (una tasa por moneda, no por compra, para no golpear
 * la API de conversión más de lo necesario). La moneda/monto originales
 * (`purchase.purchasePrice`) se preservan sin tocar para poder editar la
 * compra después sin perder lo que el usuario tipeó.
 */
@Injectable()
export class GetPurchasesPerformanceUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly purchaseRepository: PurchaseRepositoryPort,
    private readonly getAssetPrices: GetAssetPricesUseCase,
    @Inject(CURRENCY_CONVERTER)
    private readonly currencyConverter: CurrencyConverterPort,
  ) {}

  async execute(userId: string): Promise<GetPurchasesPerformanceResult> {
    const purchases = await this.purchaseRepository.findByUserId(userId);
    if (purchases.length === 0) {
      return { performances: [], errors: [] };
    }

    const [currentPricesByKey, exchangeRatesToUsd] = await Promise.all([
      this.resolveCurrentPrices(purchases),
      this.resolveExchangeRatesToUsd(purchases),
    ]);

    const performances: PurchasePerformance[] = [];
    const errors: PurchasePerformanceError[] = [];

    for (const purchase of purchases) {
      const currentPrice = currentPricesByKey.get(
        this.priceKey(purchase.assetSymbol, purchase.assetType),
      );
      if (!currentPrice) {
        errors.push({
          purchaseId: purchase.id,
          assetSymbol: purchase.assetSymbol,
          message: `Current price unavailable for "${purchase.assetSymbol}"`,
        });
        continue;
      }

      const exchangeRate = this.resolveExchangeRate(
        purchase.purchasePrice.currency,
        exchangeRatesToUsd,
      );
      if (exchangeRate === undefined) {
        errors.push({
          purchaseId: purchase.id,
          assetSymbol: purchase.assetSymbol,
          message: `Exchange rate unavailable for "${purchase.purchasePrice.currency}"`,
        });
        continue;
      }

      performances.push(
        this.buildPerformance(purchase, currentPrice, exchangeRate),
      );
    }

    return { performances, errors };
  }

  private async resolveCurrentPrices(
    purchases: Purchase[],
  ): Promise<Map<string, Money>> {
    const stockSymbols = this.distinctSymbols(
      purchases,
      PurchaseAssetType.STOCK,
    );
    const cryptoIds = this.distinctSymbols(purchases, PurchaseAssetType.CRYPTO);

    const result = await this.getAssetPrices.execute({
      stockSymbols,
      cryptoIds,
      targetCurrency: DISPLAY_CURRENCY,
    });

    const pricesByKey = new Map<string, Money>();
    for (const assetPrice of result.prices) {
      pricesByKey.set(
        this.priceKey(assetPrice.assetSymbol, assetPrice.assetType),
        assetPrice.price,
      );
    }

    return pricesByKey;
  }

  private async resolveExchangeRatesToUsd(
    purchases: Purchase[],
  ): Promise<Map<string, number>> {
    const currencies = Array.from(
      new Set(
        purchases
          .map((purchase) => purchase.purchasePrice.currency)
          .filter((currency) => currency !== DISPLAY_CURRENCY),
      ),
    );

    const rates = new Map<string, number>();
    const settledRates = await Promise.allSettled(
      currencies.map((currency) =>
        this.currencyConverter.convert(1, currency, DISPLAY_CURRENCY),
      ),
    );
    settledRates.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        rates.set(currencies[index], result.value);
      }
    });

    return rates;
  }

  private resolveExchangeRate(
    currency: string,
    exchangeRatesToUsd: Map<string, number>,
  ): number | undefined {
    return currency === DISPLAY_CURRENCY ? 1 : exchangeRatesToUsd.get(currency);
  }

  private distinctSymbols(
    purchases: Purchase[],
    assetType: PurchaseAssetType,
  ): string[] {
    const symbols = purchases
      .filter((purchase) => purchase.assetType === assetType)
      .map((purchase) => purchase.assetSymbol);
    return Array.from(new Set(symbols));
  }

  private priceKey(assetSymbol: string, assetType: string): string {
    return `${assetSymbol}|${assetType}`;
  }

  private buildPerformance(
    purchase: Purchase,
    currentPrice: Money,
    exchangeRateToUsd: number,
  ): PurchasePerformance {
    // purchase.purchasePrice.amount es el TOTAL pagado por toda la cantidad
    // (no un precio por unidad): el formulario pide "cantidad" y "precio
    // pagado" por separado porque el usuario suele saber cuánto pagó en
    // total, no el precio exacto por acción/unidad. Por eso NO se multiplica
    // por `purchase.quantity` acá (a diferencia de currentValue, donde
    // currentPrice sí es un precio por unidad que viene del proveedor de
    // mercado).
    const investedAmountUsd = purchase.purchasePrice.amount * exchangeRateToUsd;
    const currentValue = currentPrice.amount * purchase.quantity;
    const gainLoss = currentValue - investedAmountUsd;
    const gainLossPercentage =
      investedAmountUsd === 0 ? 0 : (gainLoss / investedAmountUsd) * 100;

    return {
      purchase,
      investedAmountUsd,
      currentPrice,
      currentValue,
      gainLoss,
      gainLossPercentage,
    };
  }
}
