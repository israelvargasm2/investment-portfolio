import { ConfigService } from '@nestjs/config';
import { AssetType } from '../../../domain/asset-type.enum';
import { FinnhubStockCatalogAdapter } from './finnhub-stock-catalog.adapter';

describe('FinnhubStockCatalogAdapter', () => {
  let configService: jest.Mocked<ConfigService>;
  let adapter: FinnhubStockCatalogAdapter;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue('fake-api-key'),
    } as unknown as jest.Mocked<ConfigService>;
    adapter = new FinnhubStockCatalogAdapter(configService);
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('mapea los símbolos de tipo "Common Stock" a AssetOptionRecord[]', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { symbol: 'AAPL', description: 'APPLE INC', type: 'Common Stock' },
          {
            symbol: 'MSFT',
            description: 'MICROSOFT CORP',
            type: 'Common Stock',
          },
        ]),
    });

    const result = await adapter.fetchAll();

    expect(result).toEqual([
      { symbol: 'AAPL', name: 'APPLE INC', assetType: AssetType.STOCK },
      { symbol: 'MSFT', name: 'MICROSOFT CORP', assetType: AssetType.STOCK },
    ]);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('exchange=US') as string,
    );
  });

  it('incluye los ETFs (type "ETP" en Finnhub, ej. IVV/VOO/QQQ/SPY)', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { symbol: 'AAPL', description: 'APPLE INC', type: 'Common Stock' },
          { symbol: 'SPY', description: 'SPDR S&P 500 ETF TRUST', type: 'ETP' },
          {
            symbol: 'IVV',
            description: 'ISHARES CORE S&P 500 ETF',
            type: 'ETP',
          },
        ]),
    });

    const result = await adapter.fetchAll();

    expect(result).toEqual([
      { symbol: 'AAPL', name: 'APPLE INC', assetType: AssetType.STOCK },
      {
        symbol: 'SPY',
        name: 'SPDR S&P 500 ETF TRUST',
        assetType: AssetType.STOCK,
      },
      {
        symbol: 'IVV',
        name: 'ISHARES CORE S&P 500 ETF',
        assetType: AssetType.STOCK,
      },
    ]);
  });

  it('descarta tipos que no son acción común ni ETF (warrants, ADRs, preferentes, etc.)', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { symbol: 'AAPL', description: 'APPLE INC', type: 'Common Stock' },
          { symbol: 'FOO.WS', description: 'FOO WARRANT', type: 'Warrant' },
          {
            symbol: 'BAR-PA',
            description: 'BAR PREFERRED',
            type: 'Preferred Stock',
          },
        ]),
    });

    const result = await adapter.fetchAll();

    expect(result).toEqual([
      { symbol: 'AAPL', name: 'APPLE INC', assetType: AssetType.STOCK },
    ]);
  });

  it('lanza un error cuando la respuesta HTTP no es exitosa', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 500 });

    await expect(adapter.fetchAll()).rejects.toThrow(
      'Finnhub request failed with status 500',
    );
  });

  it('lanza RateLimitExceededError cuando la respuesta HTTP es 429', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 429 });

    await expect(adapter.fetchAll()).rejects.toThrow(
      'Rate limit exceeded for Finnhub',
    );
  });
});
