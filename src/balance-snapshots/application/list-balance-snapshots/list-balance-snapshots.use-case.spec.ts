import { BalanceSnapshot } from '../../domain/entities/balance-snapshot.entity';
import type { BalanceSnapshotRepositoryPort } from '../../domain/ports/balance-snapshot-repository.port';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { ListBalanceSnapshotsUseCase } from './list-balance-snapshots.use-case';

describe('ListBalanceSnapshotsUseCase', () => {
  let snapshotRepository: jest.Mocked<BalanceSnapshotRepositoryPort>;
  let useCase: ListBalanceSnapshotsUseCase;

  beforeEach(() => {
    snapshotRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
    };
    useCase = new ListBalanceSnapshotsUseCase(snapshotRepository);
  });

  it('devuelve el histórico del usuario', async () => {
    const snapshot = new BalanceSnapshot(
      'snap-1',
      'user-1',
      Money.of(1000, 'USD'),
      new Date('2026-01-01T00:00:00.000Z'),
    );
    snapshotRepository.findByUserId.mockResolvedValue([snapshot]);

    const result = await useCase.execute('user-1');

    expect(result).toEqual([snapshot]);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(snapshotRepository.findByUserId).toHaveBeenCalledWith('user-1');
  });
});
