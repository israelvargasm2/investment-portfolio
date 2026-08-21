import { ConflictException, NotFoundException } from '@nestjs/common';
import { AddWatchlistItemUseCase } from '../../application/add-watchlist-item/add-watchlist-item.use-case';
import { GetWatchlistWithPricesUseCase } from '../../application/get-watchlist-with-prices/get-watchlist-with-prices.use-case';
import { RemoveWatchlistItemUseCase } from '../../application/remove-watchlist-item/remove-watchlist-item.use-case';
import { UpdateWatchlistItemUseCase } from '../../application/update-watchlist-item/update-watchlist-item.use-case';
import { WatchlistItem } from '../../domain/entities/watchlist-item.entity';
import { WatchlistItemAlreadyExistsError } from '../../domain/errors/watchlist-item-already-exists.error';
import { WatchlistItemNotFoundError } from '../../domain/errors/watchlist-item-not-found.error';
import { TrackedAssetType } from '../../domain/tracked-asset-type.enum';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { WatchlistController } from './watchlist.controller';

describe('WatchlistController', () => {
  let addWatchlistItem: jest.Mocked<AddWatchlistItemUseCase>;
  let getWatchlistWithPrices: jest.Mocked<GetWatchlistWithPricesUseCase>;
  let updateWatchlistItem: jest.Mocked<UpdateWatchlistItemUseCase>;
  let removeWatchlistItem: jest.Mocked<RemoveWatchlistItemUseCase>;
  let controller: WatchlistController;

  const currentUser = { id: 'user-1', email: 'ada@example.com' };

  beforeEach(() => {
    addWatchlistItem = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AddWatchlistItemUseCase>;
    getWatchlistWithPrices = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetWatchlistWithPricesUseCase>;
    updateWatchlistItem = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateWatchlistItemUseCase>;
    removeWatchlistItem = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RemoveWatchlistItemUseCase>;
    controller = new WatchlistController(
      addWatchlistItem,
      getWatchlistWithPrices,
      updateWatchlistItem,
      removeWatchlistItem,
    );
  });

  it('agrega un item usando el id del usuario autenticado', async () => {
    const item = new WatchlistItem(
      'item-1',
      'user-1',
      'AAPL',
      TrackedAssetType.STOCK,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    addWatchlistItem.execute.mockResolvedValue(item);

    const response = await controller.add(currentUser, {
      assetSymbol: 'AAPL',
      assetType: TrackedAssetType.STOCK,
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(addWatchlistItem.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      assetSymbol: 'AAPL',
      assetType: TrackedAssetType.STOCK,
    });
    expect(response).toEqual({
      id: 'item-1',
      assetSymbol: 'AAPL',
      assetType: TrackedAssetType.STOCK,
      addedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('traduce WatchlistItemAlreadyExistsError a ConflictException (409)', async () => {
    addWatchlistItem.execute.mockRejectedValue(
      new WatchlistItemAlreadyExistsError('AAPL', TrackedAssetType.STOCK),
    );

    await expect(
      controller.add(currentUser, {
        assetSymbol: 'AAPL',
        assetType: TrackedAssetType.STOCK,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('lista los items del usuario autenticado junto con su precio actual', async () => {
    const item = new WatchlistItem(
      'item-1',
      'user-1',
      'AAPL',
      TrackedAssetType.STOCK,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    getWatchlistWithPrices.execute.mockResolvedValue({
      items: [{ item, currentPrice: Money.of(227.16, 'USD') }],
      errors: [],
    });

    const response = await controller.list(currentUser);

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(getWatchlistWithPrices.execute).toHaveBeenCalledWith('user-1');
    expect(response.items).toHaveLength(1);
    expect(response.items[0].assetSymbol).toBe('AAPL');
    expect(response.items[0].currentPrice).toBe(227.16);
    expect(response.items[0].currency).toBe('USD');
  });

  it('edita un item usando el id del usuario autenticado', async () => {
    const item = new WatchlistItem(
      'item-1',
      'user-1',
      'MSFT',
      TrackedAssetType.STOCK,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    updateWatchlistItem.execute.mockResolvedValue(item);

    const response = await controller.update(currentUser, 'item-1', {
      assetSymbol: 'MSFT',
      assetType: TrackedAssetType.STOCK,
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(updateWatchlistItem.execute).toHaveBeenCalledWith(
      'item-1',
      'user-1',
      {
        assetSymbol: 'MSFT',
        assetType: TrackedAssetType.STOCK,
      },
    );
    expect(response.assetSymbol).toBe('MSFT');
  });

  it('traduce WatchlistItemAlreadyExistsError a ConflictException (409) al editar', async () => {
    updateWatchlistItem.execute.mockRejectedValue(
      new WatchlistItemAlreadyExistsError('MSFT', TrackedAssetType.STOCK),
    );

    await expect(
      controller.update(currentUser, 'item-1', {
        assetSymbol: 'MSFT',
        assetType: TrackedAssetType.STOCK,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('traduce WatchlistItemNotFoundError a NotFoundException (404) al editar', async () => {
    updateWatchlistItem.execute.mockRejectedValue(
      new WatchlistItemNotFoundError('item-1'),
    );

    await expect(
      controller.update(currentUser, 'item-1', {
        assetSymbol: 'MSFT',
        assetType: TrackedAssetType.STOCK,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('quita un item del usuario autenticado', async () => {
    removeWatchlistItem.execute.mockResolvedValue(undefined);

    await controller.remove(currentUser, 'item-1');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(removeWatchlistItem.execute).toHaveBeenCalledWith(
      'item-1',
      'user-1',
    );
  });

  it('traduce WatchlistItemNotFoundError a NotFoundException (404)', async () => {
    removeWatchlistItem.execute.mockRejectedValue(
      new WatchlistItemNotFoundError('item-1'),
    );

    await expect(controller.remove(currentUser, 'item-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
