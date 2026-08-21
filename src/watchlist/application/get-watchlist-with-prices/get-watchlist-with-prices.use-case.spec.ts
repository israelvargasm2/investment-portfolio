import { AssetType } from '../../../market-data/domain/asset-type.enum';
import { AssetPrice } from '../../../market-data/domain/entities/asset-price.entity';
import { GetAssetPricesUseCase } from '../../../market-data/application/get-asset-prices/get-asset-prices.use-case';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { WatchlistItem } from '../../domain/entities/watchlist-item.entity';
import { WatchlistRepositoryPort } from '../../domain/ports/watchlist-repository.port';
import { TrackedAssetType } from '../../domain/tracked-asset-type.enum';
import { GetWatchlistWithPricesUseCase } from './get-watchlist-with-prices.use-case';

describe('GetWatchlistWithPricesUseCase', () => {
  let watchlistRepository: jest.Mocked<WatchlistRepositoryPort>;
  let getAssetPrices: jest.Mocked<GetAssetPricesUseCase>;
  let useCase: GetWatchlistWithPricesUseCase;

  beforeEach(() => {
    watchlistRepository = {
      findByUserId: jest.fn(),
      findByUserIdAndAsset: jest.fn(),
      create: jest.fn(),
      updateByIdAndUserId: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
    };
    getAssetPrices = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetAssetPricesUseCase>;
    useCase = new GetWatchlistWithPricesUseCase(
      watchlistRepository,
      getAssetPrices,
    );
  });

  it('devuelve vacío cuando el usuario no tiene items en la watchlist', async () => {
    watchlistRepository.findByUserId.mockResolvedValue([]);

    const result = await useCase.execute('user-1');

    expect(result).toEqual({ items: [], errors: [] });
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(getAssetPrices.execute).not.toHaveBeenCalled();
  });

  it('pide el precio actual en USD para stocks y cryptos juntos', async () => {
    const stockItem = new WatchlistItem(
      'item-1',
      'user-1',
      'AAPL',
      TrackedAssetType.STOCK,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    const cryptoItem = new WatchlistItem(
      'item-2',
      'user-1',
      'bitcoin',
      TrackedAssetType.CRYPTO,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    watchlistRepository.findByUserId.mockResolvedValue([stockItem, cryptoItem]);
    getAssetPrices.execute.mockResolvedValue({
      prices: [
        new AssetPrice(
          'AAPL',
          AssetType.STOCK,
          Money.of(227.16, 'USD'),
          new Date(),
        ),
        new AssetPrice(
          'bitcoin',
          AssetType.CRYPTO,
          Money.of(65000, 'USD'),
          new Date(),
        ),
      ],
      errors: [],
    });

    const result = await useCase.execute('user-1');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(getAssetPrices.execute).toHaveBeenCalledWith({
      stockSymbols: ['AAPL'],
      cryptoIds: ['bitcoin'],
      targetCurrency: 'USD',
    });
    expect(result.errors).toHaveLength(0);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].currentPrice.amount).toBe(227.16);
    expect(result.items[1].currentPrice.amount).toBe(65000);
  });

  it('reporta un error por item cuando no se pudo obtener el precio actual', async () => {
    const item = new WatchlistItem(
      'item-1',
      'user-1',
      'UNKNOWN',
      TrackedAssetType.STOCK,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    watchlistRepository.findByUserId.mockResolvedValue([item]);
    getAssetPrices.execute.mockResolvedValue({ prices: [], errors: [] });

    const result = await useCase.execute('user-1');

    expect(result.items).toHaveLength(0);
    expect(result.errors).toEqual([
      {
        watchlistItemId: 'item-1',
        assetSymbol: 'UNKNOWN',
        message: 'Current price unavailable for "UNKNOWN"',
      },
    ]);
  });
});
