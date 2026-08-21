import { Injectable } from '@nestjs/common';
import { Money } from '../../../../shared/domain/value-objects/money.vo';
import { RateLimitExceededError } from '../../../domain/errors/rate-limit-exceeded.error';
import { StockPriceProviderPort } from '../../../domain/ports/stock-price-provider.port';
import { YahooFinanceChartResponse } from './yahoo-finance-chart-response';

const YAHOO_FINANCE_BASE_URL =
  'https://query1.finance.yahoo.com/v8/finance/chart';
// Ventana chica de precios diarios: alcanza para encontrar el último cierre
// no nulo (fines de semana/feriados dejan huecos) sin pedir de más.
const CHART_RANGE_QUERY = 'range=5d&interval=1d';

/**
 * Adaptador de salida que obtiene cotizaciones desde la API no oficial de
 * Yahoo Finance (sin API key, sin límite documentado). A diferencia de
 * Finnhub, cubre bolsas fuera de EE.UU. (incluida la Bolsa Mexicana de
 * Valores) y devuelve la moneda nativa de cada símbolo en la propia
 * respuesta, así que acá no hace falta asumirla como en FinnhubStockPriceAdapter.
 */
@Injectable()
export class YahooFinanceStockPriceAdapter implements StockPriceProviderPort {
  async getPrice(symbol: string): Promise<Money> {
    const url = `${YAHOO_FINANCE_BASE_URL}/${encodeURIComponent(symbol)}?${CHART_RANGE_QUERY}`;

    // Yahoo devuelve 403 a pedidos sin User-Agent de navegador.
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (response.status === 429) {
      throw new RateLimitExceededError('Yahoo Finance');
    }
    if (!response.ok) {
      throw new Error(
        `Yahoo Finance request failed with status ${response.status}`,
      );
    }

    const data = (await response.json()) as YahooFinanceChartResponse;
    const result = data.chart.result?.[0];
    if (!result?.meta.regularMarketPrice) {
      throw new Error(`No price data available for symbol "${symbol}"`);
    }

    // meta.regularMarketPrice puede quedar "pegado" en un valor viejo para
    // instrumentos de poco volumen (confirmado con IVVPESO.MX: reportaba un
    // precio de 2019 mientras el precio real rondaba los $150-160). El último
    // cierre no nulo de la serie diaria es la fuente confiable; solo se cae a
    // meta.regularMarketPrice si por algún motivo la serie no vino.
    const price =
      this.latestNonNullClose(result) ?? result.meta.regularMarketPrice;

    return Money.of(price, result.meta.currency);
  }

  private latestNonNullClose(
    result: NonNullable<YahooFinanceChartResponse['chart']['result']>[number],
  ): number | undefined {
    const closes = result.indicators?.quote[0]?.close ?? [];
    for (let index = closes.length - 1; index >= 0; index -= 1) {
      const close = closes[index];
      if (close !== null && close !== undefined) {
        return close;
      }
    }
    return undefined;
  }
}
