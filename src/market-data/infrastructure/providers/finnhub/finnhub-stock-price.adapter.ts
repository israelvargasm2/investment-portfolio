import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RateLimitExceededError } from '../../../domain/errors/rate-limit-exceeded.error';
import { StockPriceProviderPort } from '../../../domain/ports/stock-price-provider.port';
import { Money } from '../../../../shared/domain/value-objects/money.vo';
import { FinnhubQuoteResponse } from './finnhub-quote-response';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NATIVE_CURRENCY = 'USD';

/**
 * Adaptador de salida que obtiene cotizaciones de acciones desde Finnhub.
 * Finnhub siempre devuelve el precio en USD, sin soporte de conversión de moneda.
 */
@Injectable()
export class FinnhubStockPriceAdapter implements StockPriceProviderPort {
  constructor(private readonly configService: ConfigService) {}

  async getPrice(symbol: string): Promise<Money> {
    const apiKey = this.configService.get<string>('FINNHUB_API_KEY');
    const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;

    const response = await fetch(url);
    if (response.status === 429) {
      throw new RateLimitExceededError('Finnhub');
    }
    if (!response.ok) {
      throw new Error(`Finnhub request failed with status ${response.status}`);
    }

    const data = (await response.json()) as FinnhubQuoteResponse;
    if (!data.c || data.c <= 0) {
      throw new Error(`No price data available for symbol "${symbol}"`);
    }

    return Money.of(data.c, NATIVE_CURRENCY);
  }
}
