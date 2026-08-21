import { Money } from '../../../../shared/domain/value-objects/money.vo';
import { StockPriceProviderPort } from '../../../domain/ports/stock-price-provider.port';
import { CachingStockPriceProviderAdapter } from './caching-stock-price.adapter';

describe('CachingStockPriceProviderAdapter', () => {
  let delegate: jest.Mocked<StockPriceProviderPort>;
  let adapter: CachingStockPriceProviderAdapter;

  beforeEach(() => {
    delegate = { getPrice: jest.fn() };
    adapter = new CachingStockPriceProviderAdapter(delegate);
  });

  it('no golpea al delegate de nuevo para el mismo símbolo dentro del TTL', async () => {
    delegate.getPrice.mockResolvedValue(Money.of(227.16, 'USD'));

    const first = await adapter.getPrice('AAPL');
    const second = await adapter.getPrice('AAPL');

    expect(first).toEqual(Money.of(227.16, 'USD'));
    expect(second).toEqual(Money.of(227.16, 'USD'));
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(delegate.getPrice).toHaveBeenCalledTimes(1);
  });

  it('comparte cache entre símbolos que difieren solo en mayúsculas/minúsculas', async () => {
    delegate.getPrice.mockResolvedValue(Money.of(68.5, 'MXN'));

    await adapter.getPrice('walmex.mx');
    await adapter.getPrice('WALMEX.MX');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(delegate.getPrice).toHaveBeenCalledTimes(1);
  });

  it('golpea al delegate por separado para símbolos distintos', async () => {
    delegate.getPrice.mockResolvedValue(Money.of(100, 'USD'));

    await adapter.getPrice('AAPL');
    await adapter.getPrice('MSFT');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(delegate.getPrice).toHaveBeenCalledTimes(2);
  });

  it('propaga el error del delegate sin cachear la falla', async () => {
    delegate.getPrice.mockRejectedValueOnce(new Error('rate limited'));
    delegate.getPrice.mockResolvedValueOnce(Money.of(227.16, 'USD'));

    await expect(adapter.getPrice('AAPL')).rejects.toThrow('rate limited');
    const price = await adapter.getPrice('AAPL');

    expect(price).toEqual(Money.of(227.16, 'USD'));
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(delegate.getPrice).toHaveBeenCalledTimes(2);
  });
});
