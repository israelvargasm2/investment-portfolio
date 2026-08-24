import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { CreateBalanceSnapshotUseCase } from '../../application/create-balance-snapshot/create-balance-snapshot.use-case';
import { ListBalanceSnapshotsUseCase } from '../../application/list-balance-snapshots/list-balance-snapshots.use-case';
import { RemoveBalanceSnapshotUseCase } from '../../application/remove-balance-snapshot/remove-balance-snapshot.use-case';
import { BalanceSnapshot } from '../../domain/entities/balance-snapshot.entity';
import { BalanceSnapshotCalculationError } from '../../domain/errors/balance-snapshot-calculation.error';
import { BalanceSnapshotNotFoundError } from '../../domain/errors/balance-snapshot-not-found.error';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { BalanceSnapshotsController } from './balance-snapshots.controller';

describe('BalanceSnapshotsController', () => {
  let createSnapshot: jest.Mocked<CreateBalanceSnapshotUseCase>;
  let listSnapshots: jest.Mocked<ListBalanceSnapshotsUseCase>;
  let removeSnapshot: jest.Mocked<RemoveBalanceSnapshotUseCase>;
  let controller: BalanceSnapshotsController;

  const currentUser = { id: 'user-1', email: 'ada@example.com' };

  beforeEach(() => {
    createSnapshot = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateBalanceSnapshotUseCase>;
    listSnapshots = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ListBalanceSnapshotsUseCase>;
    removeSnapshot = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RemoveBalanceSnapshotUseCase>;
    controller = new BalanceSnapshotsController(
      createSnapshot,
      listSnapshots,
      removeSnapshot,
    );
  });

  it('crea la foto usando el id del usuario autenticado', async () => {
    const snapshot = new BalanceSnapshot(
      'snap-1',
      'user-1',
      Money.of(1500, 'USD'),
      new Date('2026-01-01T00:00:00.000Z'),
    );
    createSnapshot.execute.mockResolvedValue(snapshot);

    const response = await controller.create(currentUser, { currency: 'USD' });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(createSnapshot.execute).toHaveBeenCalledWith('user-1', 'USD');
    expect(response.id).toBe('snap-1');
    expect(response.totalAmount).toBe(1500);
  });

  it('traduce BalanceSnapshotCalculationError a ServiceUnavailableException (503)', async () => {
    createSnapshot.execute.mockRejectedValue(
      new BalanceSnapshotCalculationError('conversion failed'),
    );

    await expect(
      controller.create(currentUser, { currency: 'USD' }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('devuelve el histórico del usuario autenticado mapeado al DTO', async () => {
    const snapshot = new BalanceSnapshot(
      'snap-1',
      'user-1',
      Money.of(1500, 'USD'),
      new Date('2026-01-01T00:00:00.000Z'),
    );
    listSnapshots.execute.mockResolvedValue([snapshot]);

    const response = await controller.list(currentUser);

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(listSnapshots.execute).toHaveBeenCalledWith('user-1');
    expect(response).toHaveLength(1);
    expect(response[0].totalAmount).toBe(1500);
  });

  it('quita una foto del usuario autenticado', async () => {
    removeSnapshot.execute.mockResolvedValue(undefined);

    await controller.remove(currentUser, 'snap-1');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(removeSnapshot.execute).toHaveBeenCalledWith('snap-1', 'user-1');
  });

  it('traduce BalanceSnapshotNotFoundError a NotFoundException (404) al quitar', async () => {
    removeSnapshot.execute.mockRejectedValue(
      new BalanceSnapshotNotFoundError('snap-1'),
    );

    await expect(controller.remove(currentUser, 'snap-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
