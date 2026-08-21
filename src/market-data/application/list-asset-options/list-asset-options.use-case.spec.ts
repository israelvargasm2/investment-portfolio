import { AssetType } from '../../domain/asset-type.enum';
import { AssetOptionRepositoryPort } from '../../domain/ports/asset-option-repository.port';
import { ListAssetOptionsUseCase } from './list-asset-options.use-case';

describe('ListAssetOptionsUseCase', () => {
  let assetOptionRepository: jest.Mocked<AssetOptionRepositoryPort>;
  let useCase: ListAssetOptionsUseCase;

  beforeEach(() => {
    assetOptionRepository = { findAll: jest.fn(), upsertMany: jest.fn() };
    useCase = new ListAssetOptionsUseCase(assetOptionRepository);
  });

  it('separa los registros del repositorio en stocks y cryptos', async () => {
    assetOptionRepository.findAll.mockResolvedValue([
      { symbol: 'AAPL', name: 'Apple Inc.', assetType: AssetType.STOCK },
      { symbol: 'bitcoin', name: 'Bitcoin (BTC)', assetType: AssetType.CRYPTO },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        assetType: AssetType.STOCK,
      },
    ]);

    const result = await useCase.execute();

    expect(result).toEqual({
      stocks: [
        { symbol: 'AAPL', name: 'Apple Inc.' },
        { symbol: 'MSFT', name: 'Microsoft Corporation' },
      ],
      cryptos: [{ symbol: 'bitcoin', name: 'Bitcoin (BTC)' }],
    });
  });

  it('devuelve listas vacías cuando el repositorio no tiene datos', async () => {
    assetOptionRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual({ stocks: [], cryptos: [] });
  });
});
