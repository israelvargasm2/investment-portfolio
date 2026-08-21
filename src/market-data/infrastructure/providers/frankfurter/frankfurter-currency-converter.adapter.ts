import { Injectable } from '@nestjs/common';
import { RateLimitExceededError } from '../../../domain/errors/rate-limit-exceeded.error';
import { CurrencyConverterPort } from '../../../domain/ports/currency-converter.port';

const FRANKFURTER_BASE_URL = 'https://api.frankfurter.dev/v1';

interface FrankfurterLatestResponse {
  rates: Record<string, number>;
}

/**
 * Adaptador de salida que convierte montos entre monedas usando tasas de cambio
 * publicadas por el Banco Central Europeo a través de Frankfurter (gratis, sin API key).
 */
@Injectable()
export class FrankfurterCurrencyConverterAdapter implements CurrencyConverterPort {
  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    const url = `${FRANKFURTER_BASE_URL}/latest?base=${fromCurrency}&symbols=${toCurrency}`;

    const response = await fetch(url);
    if (response.status === 429) {
      throw new RateLimitExceededError('Frankfurter');
    }
    if (!response.ok) {
      throw new Error(
        `Currency conversion request failed with status ${response.status}`,
      );
    }

    const data = (await response.json()) as FrankfurterLatestResponse;
    const rate = data.rates[toCurrency];
    if (rate === undefined) {
      throw new Error(
        `No exchange rate available from "${fromCurrency}" to "${toCurrency}"`,
      );
    }

    return amount * rate;
  }
}
