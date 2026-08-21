import { FrankfurterCurrencyConverterAdapter } from './frankfurter-currency-converter.adapter';

describe('FrankfurterCurrencyConverterAdapter', () => {
  let adapter: FrankfurterCurrencyConverterAdapter;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    adapter = new FrankfurterCurrencyConverterAdapter();
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('convierte el monto aplicando la tasa de cambio devuelta', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rates: { EUR: 0.92 } }),
    });

    const converted = await adapter.convert(100, 'USD', 'EUR');

    expect(converted).toBe(92);
  });

  it('lanza un error cuando la respuesta HTTP no es exitosa', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 500 });

    await expect(adapter.convert(100, 'USD', 'EUR')).rejects.toThrow(
      'Currency conversion request failed with status 500',
    );
  });

  it('lanza RateLimitExceededError cuando la respuesta HTTP es 429', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 429 });

    await expect(adapter.convert(100, 'USD', 'EUR')).rejects.toThrow(
      'Rate limit exceeded for Frankfurter',
    );
  });

  it('lanza un error cuando la tasa de cambio solicitada no está disponible', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rates: {} }),
    });

    await expect(adapter.convert(100, 'USD', 'XXX')).rejects.toThrow(
      'No exchange rate available from "USD" to "XXX"',
    );
  });
});
