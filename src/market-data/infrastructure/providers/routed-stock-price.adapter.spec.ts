import { Money } from '../../../shared/domain/value-objects/money.vo';
import { FinnhubStockPriceAdapter } from './finnhub/finnhub-stock-price.adapter';
import { RoutedStockPriceAdapter } from './routed-stock-price.adapter';
import { YahooFinanceStockPriceAdapter } from './yahoo-finance/yahoo-finance-stock-price.adapter';

describe('RoutedStockPriceAdapter', () => {
  let finnhubAdapter: jest.Mocked<FinnhubStockPriceAdapter>;
  let yahooFinanceAdapter: jest.Mocked<YahooFinanceStockPriceAdapter>;
  let adapter: RoutedStockPriceAdapter;

  beforeEach(() => {
    finnhubAdapter = {
      getPrice: jest.fn(),
    } as unknown as jest.Mocked<FinnhubStockPriceAdapter>;
    yahooFinanceAdapter = {
      getPrice: jest.fn(),
    } as unknown as jest.Mocked<YahooFinanceStockPriceAdapter>;
    adapter = new RoutedStockPriceAdapter(finnhubAdapter, yahooFinanceAdapter);
  });

  it('enruta símbolos con sufijo ".MX" a Yahoo Finance', async () => {
    yahooFinanceAdapter.getPrice.mockResolvedValue(Money.of(68.5, 'MXN'));

    const price = await adapter.getPrice('WALMEX.MX');

    expect(price.currency).toBe('MXN');
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(yahooFinanceAdapter.getPrice).toHaveBeenCalledWith('WALMEX.MX');
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(finnhubAdapter.getPrice).not.toHaveBeenCalled();
  });

  it('enruta el resto de los símbolos a Finnhub', async () => {
    finnhubAdapter.getPrice.mockResolvedValue(Money.of(227.16, 'USD'));

    const price = await adapter.getPrice('AAPL');

    expect(price.currency).toBe('USD');
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(finnhubAdapter.getPrice).toHaveBeenCalledWith('AAPL');
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(yahooFinanceAdapter.getPrice).not.toHaveBeenCalled();
  });

  it('reconoce el sufijo ".MX" sin importar mayúsculas/minúsculas', async () => {
    yahooFinanceAdapter.getPrice.mockResolvedValue(Money.of(68.5, 'MXN'));

    await adapter.getPrice('walmex.mx');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(yahooFinanceAdapter.getPrice).toHaveBeenCalledWith('walmex.mx');
  });
});
