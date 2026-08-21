import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreatePurchaseUseCase } from '../../application/create-purchase/create-purchase.use-case';
import { GetPurchasesPerformanceUseCase } from '../../application/get-purchases-performance/get-purchases-performance.use-case';
import { RemovePurchaseUseCase } from '../../application/remove-purchase/remove-purchase.use-case';
import { UpdatePurchaseUseCase } from '../../application/update-purchase/update-purchase.use-case';
import { Purchase } from '../../domain/entities/purchase.entity';
import { InvalidPurchaseDateError } from '../../domain/errors/invalid-purchase-date.error';
import { PurchaseNotFoundError } from '../../domain/errors/purchase-not-found.error';
import { PurchaseAssetType } from '../../domain/purchase-asset-type.enum';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { PurchasesController } from './purchases.controller';

describe('PurchasesController', () => {
  let createPurchase: jest.Mocked<CreatePurchaseUseCase>;
  let getPurchasesPerformance: jest.Mocked<GetPurchasesPerformanceUseCase>;
  let updatePurchase: jest.Mocked<UpdatePurchaseUseCase>;
  let removePurchase: jest.Mocked<RemovePurchaseUseCase>;
  let controller: PurchasesController;

  const currentUser = { id: 'user-1', email: 'ada@example.com' };
  const dtoBody = {
    assetSymbol: 'AAPL',
    assetType: PurchaseAssetType.STOCK,
    quantity: 10,
    purchasePriceAmount: 150,
    currency: 'USD',
    purchasedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    createPurchase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreatePurchaseUseCase>;
    getPurchasesPerformance = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetPurchasesPerformanceUseCase>;
    updatePurchase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdatePurchaseUseCase>;
    removePurchase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RemovePurchaseUseCase>;
    controller = new PurchasesController(
      createPurchase,
      getPurchasesPerformance,
      updatePurchase,
      removePurchase,
    );
  });

  it('crea la compra usando el id del usuario autenticado y construye el Money desde el DTO', async () => {
    const purchase = new Purchase(
      'purchase-1',
      'user-1',
      'AAPL',
      PurchaseAssetType.STOCK,
      10,
      Money.of(150, 'USD'),
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-01-01T00:00:00.000Z'),
    );
    createPurchase.execute.mockResolvedValue(purchase);

    const response = await controller.create(currentUser, dtoBody);

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(createPurchase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      assetSymbol: 'AAPL',
      assetType: PurchaseAssetType.STOCK,
      quantity: 10,
      purchasePrice: Money.of(150, 'USD'),
      purchasedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    expect(response.id).toBe('purchase-1');
    expect(response.currency).toBe('USD');
  });

  it('traduce InvalidPurchaseDateError a BadRequestException (400) al crear', async () => {
    createPurchase.execute.mockRejectedValue(
      new InvalidPurchaseDateError('bad date'),
    );

    await expect(
      controller.create(currentUser, {
        ...dtoBody,
        purchasedAt: '2099-01-01T00:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('devuelve la performance de las compras del usuario autenticado', async () => {
    getPurchasesPerformance.execute.mockResolvedValue({
      performances: [],
      errors: [],
    });

    const response = await controller.list(currentUser);

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(getPurchasesPerformance.execute).toHaveBeenCalledWith('user-1');
    expect(response).toEqual({ purchases: [], errors: [] });
  });

  it('edita la compra usando el id del usuario autenticado', async () => {
    const purchase = new Purchase(
      'purchase-1',
      'user-1',
      'AAPL',
      PurchaseAssetType.STOCK,
      5,
      Money.of(160, 'USD'),
      new Date('2026-01-10T00:00:00.000Z'),
      new Date('2026-01-01T00:00:00.000Z'),
    );
    updatePurchase.execute.mockResolvedValue(purchase);

    const response = await controller.update(currentUser, 'purchase-1', {
      ...dtoBody,
      quantity: 5,
      purchasePriceAmount: 160,
      purchasedAt: '2026-01-10T00:00:00.000Z',
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(updatePurchase.execute).toHaveBeenCalledWith(
      'purchase-1',
      'user-1',
      {
        assetSymbol: 'AAPL',
        assetType: PurchaseAssetType.STOCK,
        quantity: 5,
        purchasePrice: Money.of(160, 'USD'),
        purchasedAt: new Date('2026-01-10T00:00:00.000Z'),
      },
    );
    expect(response.quantity).toBe(5);
  });

  it('traduce InvalidPurchaseDateError a BadRequestException (400) al editar', async () => {
    updatePurchase.execute.mockRejectedValue(
      new InvalidPurchaseDateError('bad date'),
    );

    await expect(
      controller.update(currentUser, 'purchase-1', {
        ...dtoBody,
        purchasedAt: '2099-01-01T00:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('traduce PurchaseNotFoundError a NotFoundException (404) al editar', async () => {
    updatePurchase.execute.mockRejectedValue(
      new PurchaseNotFoundError('purchase-1'),
    );

    await expect(
      controller.update(currentUser, 'purchase-1', dtoBody),
    ).rejects.toThrow(NotFoundException);
  });

  it('quita una compra del usuario autenticado', async () => {
    removePurchase.execute.mockResolvedValue(undefined);

    await controller.remove(currentUser, 'purchase-1');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(removePurchase.execute).toHaveBeenCalledWith('purchase-1', 'user-1');
  });

  it('traduce PurchaseNotFoundError a NotFoundException (404) al quitar', async () => {
    removePurchase.execute.mockRejectedValue(
      new PurchaseNotFoundError('purchase-1'),
    );

    await expect(controller.remove(currentUser, 'purchase-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
