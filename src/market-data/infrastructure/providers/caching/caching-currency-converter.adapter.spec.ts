import { CurrencyConverterPort } from '../../../domain/ports/currency-converter.port';
import { CachingCurrencyConverterAdapter } from './caching-currency-converter.adapter';

describe('CachingCurrencyConverterAdapter', () => {
  let delegate: jest.Mocked<CurrencyConverterPort>;
  let adapter: CachingCurrencyConverterAdapter;

  beforeEach(() => {
    delegate = { convert: jest.fn() };
    adapter = new CachingCurrencyConverterAdapter(delegate);
  });

  it('devuelve el monto sin llamar al delegate cuando origen y destino son la misma moneda', async () => {
    const result = await adapter.convert(500, 'usd', 'USD');

    expect(result).toBe(500);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(delegate.convert).not.toHaveBeenCalled();
  });

  it('pide la tasa (convert(1, from, to)) una sola vez y la reusa para distintos montos', async () => {
    delegate.convert.mockResolvedValue(0.05); // 1 MXN = 0.05 USD

    const first = await adapter.convert(500, 'MXN', 'USD');
    const second = await adapter.convert(1000, 'MXN', 'USD');

    expect(first).toBeCloseTo(25); // 500 * 0.05
    expect(second).toBeCloseTo(50); // 1000 * 0.05 (misma tasa cacheada)
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(delegate.convert).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(delegate.convert).toHaveBeenCalledWith(1, 'MXN', 'USD');
  });

  it('trata cada par de monedas como una entrada de cache separada', async () => {
    delegate.convert.mockResolvedValue(1);

    await adapter.convert(100, 'MXN', 'USD');
    await adapter.convert(100, 'EUR', 'USD');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(delegate.convert).toHaveBeenCalledTimes(2);
  });

  it('propaga el error del delegate sin cachear la falla', async () => {
    delegate.convert.mockRejectedValueOnce(new Error('rate limited'));
    delegate.convert.mockResolvedValueOnce(0.05);

    await expect(adapter.convert(500, 'MXN', 'USD')).rejects.toThrow(
      'rate limited',
    );
    const result = await adapter.convert(500, 'MXN', 'USD');

    expect(result).toBeCloseTo(25);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(delegate.convert).toHaveBeenCalledTimes(2);
  });
});
