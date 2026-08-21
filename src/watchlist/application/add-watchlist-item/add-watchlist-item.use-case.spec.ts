import { WatchlistItem } from '../../domain/entities/watchlist-item.entity';
import { WatchlistItemAlreadyExistsError } from '../../domain/errors/watchlist-item-already-exists.error';
import { WatchlistRepositoryPort } from '../../domain/ports/watchlist-repository.port';
import { TrackedAssetType } from '../../domain/tracked-asset-type.enum';
import { AddWatchlistItemUseCase } from './add-watchlist-item.use-case';

describe('AddWatchlistItemUseCase', () => {
  let watchlistRepository: jest.Mocked<WatchlistRepositoryPort>;
  let useCase: AddWatchlistItemUseCase;

  beforeEach(() => {
    watchlistRepository = {
      findByUserId: jest.fn(),
      findByUserIdAndAsset: jest.fn(),
      create: jest.fn(),
      updateByIdAndUserId: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
    };
    useCase = new AddWatchlistItemUseCase(watchlistRepository);
  });

  it('crea el item cuando el usuario todavía no sigue ese activo', async () => {
    watchlistRepository.findByUserIdAndAsset.mockResolvedValue(null);
    const createdItem = new WatchlistItem(
      'item-1',
      'user-1',
      'AAPL',
      TrackedAssetType.STOCK,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    watchlistRepository.create.mockResolvedValue(createdItem);

    const result = await useCase.execute({
      userId: 'user-1',
      assetSymbol: 'AAPL',
      assetType: TrackedAssetType.STOCK,
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(watchlistRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      assetSymbol: 'AAPL',
      assetType: TrackedAssetType.STOCK,
    });
    expect(result).toBe(createdItem);
  });

  it('lanza WatchlistItemAlreadyExistsError cuando el usuario ya sigue ese activo', async () => {
    watchlistRepository.findByUserIdAndAsset.mockResolvedValue(
      new WatchlistItem(
        'item-1',
        'user-1',
        'AAPL',
        TrackedAssetType.STOCK,
        new Date(),
      ),
    );

    await expect(
      useCase.execute({
        userId: 'user-1',
        assetSymbol: 'AAPL',
        assetType: TrackedAssetType.STOCK,
      }),
    ).rejects.toBeInstanceOf(WatchlistItemAlreadyExistsError);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(watchlistRepository.create).not.toHaveBeenCalled();
  });
});
