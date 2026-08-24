import { BalanceSnapshotNotFoundError } from '../../domain/errors/balance-snapshot-not-found.error';
import type { BalanceSnapshotRepositoryPort } from '../../domain/ports/balance-snapshot-repository.port';
import { RemoveBalanceSnapshotUseCase } from './remove-balance-snapshot.use-case';

describe('RemoveBalanceSnapshotUseCase', () => {
  let snapshotRepository: jest.Mocked<BalanceSnapshotRepositoryPort>;
  let useCase: RemoveBalanceSnapshotUseCase;

  beforeEach(() => {
    snapshotRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
    };
    useCase = new RemoveBalanceSnapshotUseCase(snapshotRepository);
  });

  it('elimina la foto cuando el repositorio confirma el borrado', async () => {
    snapshotRepository.deleteByIdAndUserId.mockResolvedValue(true);

    await expect(useCase.execute('snap-1', 'user-1')).resolves.toBeUndefined();
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(snapshotRepository.deleteByIdAndUserId).toHaveBeenCalledWith(
      'snap-1',
      'user-1',
    );
  });

  it('lanza BalanceSnapshotNotFoundError si no se borró nada', async () => {
    snapshotRepository.deleteByIdAndUserId.mockResolvedValue(false);

    await expect(useCase.execute('missing-snap', 'user-1')).rejects.toThrow(
      BalanceSnapshotNotFoundError,
    );
  });
});
