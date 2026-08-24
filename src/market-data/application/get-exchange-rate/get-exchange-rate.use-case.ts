import { Inject, Injectable } from '@nestjs/common';
import { CURRENCY_CONVERTER } from '../../domain/ports/currency-converter.port';
import type { CurrencyConverterPort } from '../../domain/ports/currency-converter.port';

/**
 * Caso de uso: expone una tasa de cambio simple (cuántas unidades de "to"
 * equivalen a 1 "from") reusando CurrencyConverterPort — el mismo puerto que
 * ya usan GetAssetPricesUseCase/GetPurchasesPerformanceUseCase, con su cache
 * de 1h (ver CachingCurrencyConverterAdapter). Pensado para el selector de
 * moneda de visualización del frontend (USD/MXN), que necesita una tasa
 * plana, no un precio de asset.
 */
@Injectable()
export class GetExchangeRateUseCase {
  constructor(
    @Inject(CURRENCY_CONVERTER)
    private readonly currencyConverter: CurrencyConverterPort,
  ) {}

  async execute(from: string, to: string): Promise<number> {
    return this.currencyConverter.convert(
      1,
      from.toUpperCase(),
      to.toUpperCase(),
    );
  }
}
