import { Repository } from 'typeorm';
import { TrackedAssetType } from '../../../domain/tracked-asset-type.enum';
import { WatchlistItemOrmEntity } from './watchlist-item.orm-entity';
import { TypeOrmWatchlistRepository } from './typeorm-watchlist.repository';

describe('TypeOrmWatchlistRepository', () => {
  let repository: jest.Mocked<Repository<WatchlistItemOrmEntity>>;
  let watchlistRepository: TypeOrmWatchlistRepository;

  const row: WatchlistItemOrmEntity = {
    id: 'item-1',
    userId: 'user-1',
    assetSymbol: 'AAPL',
    assetType: TrackedAssetType.STOCK,
    addedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<WatchlistItemOrmEntity>>;
    watchlistRepository = new TypeOrmWatchlistRepository(repository);
  });

  it('lista y mapea los items del usuario ordenados por fecha de alta', async () => {
    repository.find.mockResolvedValue([row]);

    const result = await watchlistRepository.findByUserId('user-1');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(repository.find).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      order: { addedAt: 'ASC' },
    });
    expect(result).toHaveLength(1);
    expect(result[0].assetSymbol).toBe('AAPL');
  });

  it('devuelve null cuando no encuentra el activo para ese usuario', async () => {
    repository.findOne.mockResolvedValue(null);

    const result = await watchlistRepository.findByUserIdAndAsset(
      'user-1',
      'AAPL',
      TrackedAssetType.STOCK,
    );

    expect(result).toBeNull();
  });

  it('crea y guarda un item nuevo, devolviendo la entidad de dominio mapeada', async () => {
    repository.create.mockReturnValue(row);
    repository.save.mockResolvedValue(row);

    const result = await watchlistRepository.create({
      userId: 'user-1',
      assetSymbol: 'AAPL',
      assetType: TrackedAssetType.STOCK,
    });

    expect(result.id).toBe('item-1');
  });

  it('actualiza el item y devuelve la entidad mapeada cuando pertenece al usuario', async () => {
    repository.update.mockResolvedValue({
      affected: 1,
      raw: {},
      generatedMaps: [],
    });
    repository.findOne.mockResolvedValue({ ...row, assetSymbol: 'MSFT' });

    const result = await watchlistRepository.updateByIdAndUserId(
      'item-1',
      'user-1',
      {
        assetSymbol: 'MSFT',
        assetType: TrackedAssetType.STOCK,
      },
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(repository.update).toHaveBeenCalledWith(
      { id: 'item-1', userId: 'user-1' },
      { assetSymbol: 'MSFT', assetType: TrackedAssetType.STOCK },
    );
    expect(result?.assetSymbol).toBe('MSFT');
  });

  it('devuelve null al actualizar cuando el item no existe o no pertenece al usuario', async () => {
    repository.update.mockResolvedValue({
      affected: 0,
      raw: {},
      generatedMaps: [],
    });

    const result = await watchlistRepository.updateByIdAndUserId(
      'item-1',
      'user-1',
      {
        assetSymbol: 'MSFT',
        assetType: TrackedAssetType.STOCK,
      },
    );

    expect(result).toBeNull();
  });

  it('devuelve true al borrar cuando el item pertenece al usuario', async () => {
    repository.delete.mockResolvedValue({ affected: 1, raw: {} });

    const result = await watchlistRepository.deleteByIdAndUserId(
      'item-1',
      'user-1',
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(repository.delete).toHaveBeenCalledWith({
      id: 'item-1',
      userId: 'user-1',
    });
    expect(result).toBe(true);
  });

  it('devuelve false al borrar cuando el item no existe o no pertenece al usuario', async () => {
    repository.delete.mockResolvedValue({ affected: 0, raw: {} });

    const result = await watchlistRepository.deleteByIdAndUserId(
      'item-1',
      'user-1',
    );

    expect(result).toBe(false);
  });
});
