import { Injectable } from '@nestjs/common';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { StockPriceProviderPort } from '../../domain/ports/stock-price-provider.port';
import { FinnhubStockPriceAdapter } from './finnhub/finnhub-stock-price.adapter';
import { YahooFinanceStockPriceAdapter } from './yahoo-finance/yahoo-finance-stock-price.adapter';

const BMV_SYMBOL_SUFFIX = '.MX';

/**
 * Adaptador de salida que decide, según el símbolo, a qué proveedor pedirle
 * el precio: Finnhub (EE.UU., siempre USD) para el resto, o Yahoo Finance
 * para símbolos de la Bolsa Mexicana de Valores (sufijo ".MX", en pesos
 * mexicanos) — Finnhub free tier no cubre la BMV. GetAssetPricesUseCase
 * sigue viendo un único StockPriceProviderPort, sin saber que hay dos
 * proveedores detrás.
 */
@Injectable()
export class RoutedStockPriceAdapter implements StockPriceProviderPort {
  constructor(
    private readonly finnhubAdapter: FinnhubStockPriceAdapter,
    private readonly yahooFinanceAdapter: YahooFinanceStockPriceAdapter,
  ) {}

  getPrice(symbol: string): Promise<Money> {
    if (symbol.toUpperCase().endsWith(BMV_SYMBOL_SUFFIX)) {
      return this.yahooFinanceAdapter.getPrice(symbol);
    }
    return this.finnhubAdapter.getPrice(symbol);
  }
}
