import { Repository } from 'typeorm';
import { AssetType } from '../../../domain/asset-type.enum';
import { AssetOptionOrmEntity } from './asset-option.orm-entity';
import { TypeOrmAssetOptionRepository } from './typeorm-asset-option.repository';

describe('TypeOrmAssetOptionRepository', () => {
  let repository: jest.Mocked<Repository<AssetOptionOrmEntity>>;
  let assetOptionRepository: TypeOrmAssetOptionRepository;

  beforeEach(() => {
    repository = {
      find: jest.fn(),
      upsert: jest.fn(),
    } as unknown as jest.Mocked<Repository<AssetOptionOrmEntity>>;
    assetOptionRepository = new TypeOrmAssetOptionRepository(repository);
  });

  it('lista y mapea las opciones ordenadas por nombre', async () => {
    const row: AssetOptionOrmEntity = {
      id: 'option-1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      assetType: AssetType.STOCK,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    repository.find.mockResolvedValue([row]);

    const result = await assetOptionRepository.findAll();

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(repository.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
    expect(result).toEqual([
      { symbol: 'AAPL', name: 'Apple Inc.', assetType: AssetType.STOCK },
    ]);
  });

  it('hace upsert por (symbol, assetType) cuando hay registros', async () => {
    const records = [
      { symbol: 'AAPL', name: 'Apple Inc.', assetType: AssetType.STOCK },
    ];

    await assetOptionRepository.upsertMany(records);

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(repository.upsert).toHaveBeenCalledWith(records, {
      conflictPaths: ['symbol', 'assetType'],
    });
  });

  it('no llama a upsert cuando la lista está vacía', async () => {
    await assetOptionRepository.upsertMany([]);

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it('trocea en tandas de 1000 para no superar el límite de parámetros de Postgres', async () => {
    const records = Array.from({ length: 2500 }, (_, index) => ({
      symbol: `SYM${index}`,
      name: `Symbol ${index}`,
      assetType: AssetType.STOCK,
    }));

    await assetOptionRepository.upsertMany(records);

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(repository.upsert).toHaveBeenCalledTimes(3);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(repository.upsert).toHaveBeenNthCalledWith(
      1,
      records.slice(0, 1000),
      {
        conflictPaths: ['symbol', 'assetType'],
      },
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(repository.upsert).toHaveBeenNthCalledWith(
      3,
      records.slice(2000, 2500),
      {
        conflictPaths: ['symbol', 'assetType'],
      },
    );
  });
});
