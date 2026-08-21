import { WatchlistItem } from '../../domain/entities/watchlist-item.entity';
import { WatchlistItemAlreadyExistsError } from '../../domain/errors/watchlist-item-already-exists.error';
import { WatchlistItemNotFoundError } from '../../domain/errors/watchlist-item-not-found.error';
import { WatchlistRepositoryPort } from '../../domain/ports/watchlist-repository.port';
import { TrackedAssetType } from '../../domain/tracked-asset-type.enum';
import { UpdateWatchlistItemUseCase } from './update-watchlist-item.use-case';

describe('UpdateWatchlistItemUseCase', () => {
  let watchlistRepository: jest.Mocked<WatchlistRepositoryPort>;
  let useCase: UpdateWatchlistItemUseCase;

  beforeEach(() => {
    watchlistRepository = {
      findByUserId: jest.fn(),
      findByUserIdAndAsset: jest.fn(),
      create: jest.fn(),
      updateByIdAndUserId: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
    };
    useCase = new UpdateWatchlistItemUseCase(watchlistRepository);
  });

  it('actualiza el item cuando no hay conflicto con otro activo', async () => {
    watchlistRepository.findByUserIdAndAsset.mockResolvedValue(null);
    const updatedItem = new WatchlistItem(
      'item-1',
      'user-1',
      'MSFT',
      TrackedAssetType.STOCK,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    watchlistRepository.updateByIdAndUserId.mockResolvedValue(updatedItem);

    const result = await useCase.execute('item-1', 'user-1', {
      assetSymbol: 'MSFT',
      assetType: TrackedAssetType.STOCK,
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(watchlistRepository.updateByIdAndUserId).toHaveBeenCalledWith(
      'item-1',
      'user-1',
      {
        assetSymbol: 'MSFT',
        assetType: TrackedAssetType.STOCK,
      },
    );
    expect(result).toBe(updatedItem);
  });

  it('permite "actualizar" un item con los mismos datos que ya tenía (no es conflicto consigo mismo)', async () => {
    const existingItem = new WatchlistItem(
      'item-1',
      'user-1',
      'AAPL',
      TrackedAssetType.STOCK,
      new Date(),
    );
    watchlistRepository.findByUserIdAndAsset.mockResolvedValue(existingItem);
    watchlistRepository.updateByIdAndUserId.mockResolvedValue(existingItem);

    await useCase.execute('item-1', 'user-1', {
      assetSymbol: 'AAPL',
      assetType: TrackedAssetType.STOCK,
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(watchlistRepository.updateByIdAndUserId).toHaveBeenCalled();
  });

  it('lanza WatchlistItemAlreadyExistsError cuando el nuevo símbolo/tipo ya lo sigue en otro item', async () => {
    watchlistRepository.findByUserIdAndAsset.mockResolvedValue(
      new WatchlistItem(
        'item-2',
        'user-1',
        'MSFT',
        TrackedAssetType.STOCK,
        new Date(),
      ),
    );

    await expect(
      useCase.execute('item-1', 'user-1', {
        assetSymbol: 'MSFT',
        assetType: TrackedAssetType.STOCK,
      }),
    ).rejects.toBeInstanceOf(WatchlistItemAlreadyExistsError);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(watchlistRepository.updateByIdAndUserId).not.toHaveBeenCalled();
  });

  it('lanza WatchlistItemNotFoundError cuando el item no existe o no pertenece al usuario', async () => {
    watchlistRepository.findByUserIdAndAsset.mockResolvedValue(null);
    watchlistRepository.updateByIdAndUserId.mockResolvedValue(null);

    await expect(
      useCase.execute('item-1', 'user-1', {
        assetSymbol: 'MSFT',
        assetType: TrackedAssetType.STOCK,
      }),
    ).rejects.toBeInstanceOf(WatchlistItemNotFoundError);
  });
});
