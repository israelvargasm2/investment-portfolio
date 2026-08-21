import { YahooFinanceStockPriceAdapter } from './yahoo-finance-stock-price.adapter';

describe('YahooFinanceStockPriceAdapter', () => {
  let adapter: YahooFinanceStockPriceAdapter;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    adapter = new YahooFinanceStockPriceAdapter();
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('usa el último cierre no nulo de la serie diaria (más confiable que meta.regularMarketPrice)', async () => {
    // Caso real: IVVPESO.MX reportaba meta.regularMarketPrice=29.76 (un
    // precio de 2019, instrumento de poco volumen) mientras la serie diaria
    // ya tenía cierres recientes de ~156. Ver el comentario en el adaptador.
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          chart: {
            result: [
              {
                meta: { currency: 'MXN', regularMarketPrice: 29.76 },
                indicators: {
                  quote: [{ close: [150.75, 151.06, 156.63, null] }],
                },
              },
            ],
            error: null,
          },
        }),
    });

    const price = await adapter.getPrice('IVVPESO.MX');

    expect(price.amount).toBe(156.63);
    expect(price.currency).toBe('MXN');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/IVVPESO.MX?range=5d&interval=1d') as string,
      expect.objectContaining({
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }) as object,
    );
  });

  it('cae a meta.regularMarketPrice cuando la respuesta no trae la serie diaria', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          chart: {
            result: [{ meta: { currency: 'MXN', regularMarketPrice: 68.5 } }],
            error: null,
          },
        }),
    });

    const price = await adapter.getPrice('WALMEX.MX');

    expect(price.amount).toBe(68.5);
    expect(price.currency).toBe('MXN');
  });

  it('lanza un error cuando la respuesta HTTP no es exitosa', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 500 });

    await expect(adapter.getPrice('WALMEX.MX')).rejects.toThrow(
      'Yahoo Finance request failed with status 500',
    );
  });

  it('lanza RateLimitExceededError cuando la respuesta HTTP es 429', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 429 });

    await expect(adapter.getPrice('WALMEX.MX')).rejects.toThrow(
      'Rate limit exceeded for Yahoo Finance',
    );
  });

  it('lanza un error cuando el símbolo no tiene resultados', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          chart: {
            result: null,
            error: { code: 'Not Found', description: 'No data found' },
          },
        }),
    });

    await expect(adapter.getPrice('INVALID.MX')).rejects.toThrow(
      'No price data available for symbol "INVALID.MX"',
    );
  });
});
