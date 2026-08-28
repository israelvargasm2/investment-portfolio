import { Repository } from 'typeorm';
import { Money } from '../../../../shared/domain/value-objects/money.vo';
import { BalanceSnapshotScope } from '../../../domain/balance-snapshot-scope.enum';
import { BalanceSnapshotOrmEntity } from './balance-snapshot.orm-entity';
import { TypeOrmBalanceSnapshotRepository } from './typeorm-balance-snapshot.repository';

describe('TypeOrmBalanceSnapshotRepository', () => {
  let repository: jest.Mocked<Repository<BalanceSnapshotOrmEntity>>;
  let snapshotRepository: TypeOrmBalanceSnapshotRepository;

  const row: BalanceSnapshotOrmEntity = {
    id: 'snap-1',
    userId: 'user-1',
    totalAmount: 1500,
    currency: 'USD',
    scope: BalanceSnapshotScope.ALL,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    repository = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<BalanceSnapshotOrmEntity>>;
    snapshotRepository = new TypeOrmBalanceSnapshotRepository(repository);
  });

  it('lista y mapea el histórico del usuario, ordenado ascendente', async () => {
    repository.find.mockResolvedValue([row]);

    const result = await snapshotRepository.findByUserId('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].total.amount).toBe(1500);
    expect(result[0].total.currency).toBe('USD');
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(repository.find).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      order: { createdAt: 'ASC' },
    });
  });

  it('crea y guarda una foto nueva, separando el Money en dos columnas', async () => {
    repository.create.mockReturnValue(row);
    repository.save.mockResolvedValue(row);

    const result = await snapshotRepository.create({
      userId: 'user-1',
      total: Money.of(1500, 'USD'),
      scope: BalanceSnapshotScope.ALL,
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(repository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      totalAmount: 1500,
      currency: 'USD',
      scope: BalanceSnapshotScope.ALL,
    });
    expect(result.id).toBe('snap-1');
  });

  it('devuelve true al borrar cuando la foto pertenece al usuario', async () => {
    repository.delete.mockResolvedValue({ affected: 1, raw: {} });

    const result = await snapshotRepository.deleteByIdAndUserId(
      'snap-1',
      'user-1',
    );

    expect(result).toBe(true);
  });

  it('devuelve false al borrar cuando la foto no existe o no pertenece al usuario', async () => {
    repository.delete.mockResolvedValue({ affected: 0, raw: {} });

    const result = await snapshotRepository.deleteByIdAndUserId(
      'snap-1',
      'user-1',
    );

    expect(result).toBe(false);
  });
});
