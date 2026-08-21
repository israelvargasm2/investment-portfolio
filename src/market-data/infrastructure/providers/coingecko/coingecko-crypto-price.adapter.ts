import { Injectable } from '@nestjs/common';
import { RateLimitExceededError } from '../../../domain/errors/rate-limit-exceeded.error';
import { CryptoPriceProviderPort } from '../../../domain/ports/crypto-price-provider.port';
import { Money } from '../../../../shared/domain/value-objects/money.vo';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

type CoinGeckoSimplePriceResponse = Record<string, Record<string, number>>;

/**
 * Adaptador de salida que obtiene precios de criptomonedas desde CoinGecko.
 * A diferencia de Finnhub, CoinGecko soporta devolver el precio directamente
 * en la moneda destino, por lo que no requiere conversión adicional.
 * `coinId` debe ser un id de CoinGecko (ej. "bitcoin"), no un ticker (ej. "BTC").
 */
@Injectable()
export class CoinGeckoCryptoPriceAdapter implements CryptoPriceProviderPort {
  async getPrice(coinId: string, currency: string): Promise<Money> {
    const vsCurrency = currency.toLowerCase();
    const url = `${COINGECKO_BASE_URL}/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=${encodeURIComponent(vsCurrency)}`;

    const response = await fetch(url);
    if (response.status === 429) {
      throw new RateLimitExceededError('CoinGecko');
    }
    if (!response.ok) {
      throw new Error(
        `CoinGecko request failed with status ${response.status}`,
      );
    }

    const data = (await response.json()) as CoinGeckoSimplePriceResponse;
    const price = data[coinId]?.[vsCurrency];
    if (price === undefined) {
      throw new Error(
        `No price data available for "${coinId}" in "${currency}"`,
      );
    }

    return Money.of(price, currency);
  }
}
