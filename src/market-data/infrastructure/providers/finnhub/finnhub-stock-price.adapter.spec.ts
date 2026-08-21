import { ConfigService } from '@nestjs/config';
import { FinnhubStockPriceAdapter } from './finnhub-stock-price.adapter';

describe('FinnhubStockPriceAdapter', () => {
  let configService: jest.Mocked<ConfigService>;
  let adapter: FinnhubStockPriceAdapter;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue('fake-api-key'),
    } as unknown as jest.Mocked<ConfigService>;
    adapter = new FinnhubStockPriceAdapter(configService);
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('devuelve el precio actual en USD cuando Finnhub responde correctamente', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ c: 227.16 }),
    });

    const price = await adapter.getPrice('AAPL');

    expect(price.amount).toBe(227.16);
    expect(price.currency).toBe('USD');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('symbol=AAPL') as string,
    );
  });

  it('lanza un error cuando la respuesta HTTP no es exitosa', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 500 });

    await expect(adapter.getPrice('AAPL')).rejects.toThrow(
      'Finnhub request failed with status 500',
    );
  });

  it('lanza RateLimitExceededError cuando la respuesta HTTP es 429', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 429 });

    await expect(adapter.getPrice('AAPL')).rejects.toThrow(
      'Rate limit exceeded for Finnhub',
    );
  });

  it('lanza un error cuando el símbolo no tiene datos de precio (c = 0)', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ c: 0 }),
    });

    await expect(adapter.getPrice('INVALID')).rejects.toThrow(
      'No price data available for symbol "INVALID"',
    );
  });
});
