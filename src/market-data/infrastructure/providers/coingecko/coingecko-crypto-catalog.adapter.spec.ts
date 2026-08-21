import { AssetType } from '../../../domain/asset-type.enum';
import { CoinGeckoCryptoCatalogAdapter } from './coingecko-crypto-catalog.adapter';

describe('CoinGeckoCryptoCatalogAdapter', () => {
  let adapter: CoinGeckoCryptoCatalogAdapter;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    adapter = new CoinGeckoCryptoCatalogAdapter();
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('mapea la respuesta de CoinGecko a AssetOptionRecord[]', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
          { id: 'ethereum', symbol: 'eth', name: 'Ethereum' },
        ]),
    });

    const result = await adapter.fetchAll();

    expect(result).toEqual([
      { symbol: 'bitcoin', name: 'Bitcoin (BTC)', assetType: AssetType.CRYPTO },
      {
        symbol: 'ethereum',
        name: 'Ethereum (ETH)',
        assetType: AssetType.CRYPTO,
      },
    ]);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/coins/list?status=active') as string,
    );
  });

  it('lanza un error cuando la respuesta HTTP no es exitosa', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 500 });

    await expect(adapter.fetchAll()).rejects.toThrow(
      'CoinGecko request failed with status 500',
    );
  });

  it('lanza RateLimitExceededError cuando la respuesta HTTP es 429', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 429 });

    await expect(adapter.fetchAll()).rejects.toThrow(
      'Rate limit exceeded for CoinGecko',
    );
  });
});
