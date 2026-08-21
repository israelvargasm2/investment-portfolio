import { WatchlistItemNotFoundError } from '../../domain/errors/watchlist-item-not-found.error';
import { WatchlistRepositoryPort } from '../../domain/ports/watchlist-repository.port';
import { RemoveWatchlistItemUseCase } from './remove-watchlist-item.use-case';

describe('RemoveWatchlistItemUseCase', () => {
  let watchlistRepository: jest.Mocked<WatchlistRepositoryPort>;
  let useCase: RemoveWatchlistItemUseCase;

  beforeEach(() => {
    watchlistRepository = {
      findByUserId: jest.fn(),
      findByUserIdAndAsset: jest.fn(),
      create: jest.fn(),
      updateByIdAndUserId: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
    };
    useCase = new RemoveWatchlistItemUseCase(watchlistRepository);
  });

  it('borra el item cuando pertenece al usuario', async () => {
    watchlistRepository.deleteByIdAndUserId.mockResolvedValue(true);

    await expect(useCase.execute('item-1', 'user-1')).resolves.toBeUndefined();
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(watchlistRepository.deleteByIdAndUserId).toHaveBeenCalledWith(
      'item-1',
      'user-1',
    );
  });

  it('lanza WatchlistItemNotFoundError cuando no existe o no pertenece al usuario', async () => {
    watchlistRepository.deleteByIdAndUserId.mockResolvedValue(false);

    await expect(useCase.execute('item-1', 'user-1')).rejects.toBeInstanceOf(
      WatchlistItemNotFoundError,
    );
  });
});
