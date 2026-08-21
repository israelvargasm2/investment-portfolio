import { AssetType } from '../../domain/asset-type.enum';
import { AssetOptionRepositoryPort } from '../../domain/ports/asset-option-repository.port';
import { CryptoCatalogProviderPort } from '../../domain/ports/crypto-catalog-provider.port';
import { StockCatalogProviderPort } from '../../domain/ports/stock-catalog-provider.port';
import { buildBmvSicMirrors } from './bmv-sic-mirrors';
import { BMV_STOCK_CATALOG } from './bmv-stock-catalog.constants';
import { RefreshAssetOptionsUseCase } from './refresh-asset-options.use-case';

describe('RefreshAssetOptionsUseCase', () => {
  let assetOptionRepository: jest.Mocked<AssetOptionRepositoryPort>;
  let cryptoCatalogProvider: jest.Mocked<CryptoCatalogProviderPort>;
  let stockCatalogProvider: jest.Mocked<StockCatalogProviderPort>;
  let useCase: RefreshAssetOptionsUseCase;

  beforeEach(() => {
    assetOptionRepository = { findAll: jest.fn(), upsertMany: jest.fn() };
    cryptoCatalogProvider = { fetchAll: jest.fn() };
    stockCatalogProvider = { fetchAll: jest.fn() };
    useCase = new RefreshAssetOptionsUseCase(
      assetOptionRepository,
      cryptoCatalogProvider,
      stockCatalogProvider,
    );
  });

  it('combina stocks de EE.UU. + BMV + espejos SIC + criptos, y hace upsert de todo', async () => {
    const usStocks = [
      { symbol: 'AAPL', name: 'Apple Inc.', assetType: AssetType.STOCK },
    ];
    const cryptos = [
      { symbol: 'bitcoin', name: 'Bitcoin (BTC)', assetType: AssetType.CRYPTO },
    ];
    stockCatalogProvider.fetchAll.mockResolvedValue(usStocks);
    cryptoCatalogProvider.fetchAll.mockResolvedValue(cryptos);

    const result = await useCase.execute();

    const bmvSicMirrors = buildBmvSicMirrors(usStocks);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(assetOptionRepository.upsertMany).toHaveBeenCalledWith([
      ...usStocks,
      ...BMV_STOCK_CATALOG,
      ...bmvSicMirrors,
      ...cryptos,
    ]);
    expect(result).toEqual({
      stocksCount:
        usStocks.length + BMV_STOCK_CATALOG.length + bmvSicMirrors.length,
      cryptosCount: 1,
    });
  });

  it('propaga el error si no se pudo obtener el catálogo de criptos', async () => {
    stockCatalogProvider.fetchAll.mockResolvedValue([]);
    cryptoCatalogProvider.fetchAll.mockRejectedValue(
      new Error('CoinGecko down'),
    );

    await expect(useCase.execute()).rejects.toThrow('CoinGecko down');
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(assetOptionRepository.upsertMany).not.toHaveBeenCalled();
  });

  it('propaga el error si no se pudo obtener el catálogo de stocks', async () => {
    cryptoCatalogProvider.fetchAll.mockResolvedValue([]);
    stockCatalogProvider.fetchAll.mockRejectedValue(new Error('Finnhub down'));

    await expect(useCase.execute()).rejects.toThrow('Finnhub down');
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(assetOptionRepository.upsertMany).not.toHaveBeenCalled();
  });
});
