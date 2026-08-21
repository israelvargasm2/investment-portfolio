import { CoinGeckoCryptoPriceAdapter } from './coingecko-crypto-price.adapter';

describe('CoinGeckoCryptoPriceAdapter', () => {
  let adapter: CoinGeckoCryptoPriceAdapter;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    adapter = new CoinGeckoCryptoPriceAdapter();
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('devuelve el precio en la moneda solicitada cuando CoinGecko responde correctamente', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ bitcoin: { usd: 60321.55 } }),
    });

    const price = await adapter.getPrice('bitcoin', 'USD');

    expect(price.amount).toBe(60321.55);
    expect(price.currency).toBe('USD');
  });

  it('lanza un error cuando la respuesta HTTP no es exitosa', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 500 });

    await expect(adapter.getPrice('bitcoin', 'USD')).rejects.toThrow(
      'CoinGecko request failed with status 500',
    );
  });

  it('lanza RateLimitExceededError cuando la respuesta HTTP es 429', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 429 });

    await expect(adapter.getPrice('bitcoin', 'USD')).rejects.toThrow(
      'Rate limit exceeded for CoinGecko',
    );
  });

  it('lanza un error cuando el id de la cripto o la moneda no existen en la respuesta', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await expect(adapter.getPrice('unknown-coin', 'USD')).rejects.toThrow(
      'No price data available for "unknown-coin" in "USD"',
    );
  });
});
