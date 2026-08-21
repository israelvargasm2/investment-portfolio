import { Money } from '../../../shared/domain/value-objects/money.vo';
import { Purchase } from '../../domain/entities/purchase.entity';
import { InvalidPurchaseDateError } from '../../domain/errors/invalid-purchase-date.error';
import { PurchaseNotFoundError } from '../../domain/errors/purchase-not-found.error';
import { PurchaseRepositoryPort } from '../../domain/ports/purchase-repository.port';
import { PurchaseAssetType } from '../../domain/purchase-asset-type.enum';
import { UpdatePurchaseUseCase } from './update-purchase.use-case';

describe('UpdatePurchaseUseCase', () => {
  let purchaseRepository: jest.Mocked<PurchaseRepositoryPort>;
  let useCase: UpdatePurchaseUseCase;

  beforeEach(() => {
    purchaseRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      updateByIdAndUserId: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
    };
    useCase = new UpdatePurchaseUseCase(purchaseRepository);
  });

  it('actualiza la compra cuando la fecha no es futura', async () => {
    const data = {
      assetSymbol: 'AAPL',
      assetType: PurchaseAssetType.STOCK,
      quantity: 5,
      purchasePrice: Money.of(160, 'USD'),
      purchasedAt: new Date('2026-01-10T00:00:00.000Z'),
    };
    const updatedPurchase = new Purchase(
      'purchase-1',
      'user-1',
      'AAPL',
      PurchaseAssetType.STOCK,
      5,
      Money.of(160, 'USD'),
      new Date('2026-01-10T00:00:00.000Z'),
      new Date('2026-01-01T00:00:00.000Z'),
    );
    purchaseRepository.updateByIdAndUserId.mockResolvedValue(updatedPurchase);

    const result = await useCase.execute('purchase-1', 'user-1', data);

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(purchaseRepository.updateByIdAndUserId).toHaveBeenCalledWith(
      'purchase-1',
      'user-1',
      data,
    );
    expect(result).toBe(updatedPurchase);
  });

  it('lanza InvalidPurchaseDateError cuando la fecha de compra es futura', async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await expect(
      useCase.execute('purchase-1', 'user-1', {
        assetSymbol: 'AAPL',
        assetType: PurchaseAssetType.STOCK,
        quantity: 5,
        purchasePrice: Money.of(160, 'USD'),
        purchasedAt: futureDate,
      }),
    ).rejects.toBeInstanceOf(InvalidPurchaseDateError);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(purchaseRepository.updateByIdAndUserId).not.toHaveBeenCalled();
  });

  it('lanza PurchaseNotFoundError cuando la compra no existe o no pertenece al usuario', async () => {
    purchaseRepository.updateByIdAndUserId.mockResolvedValue(null);

    await expect(
      useCase.execute('purchase-1', 'user-1', {
        assetSymbol: 'AAPL',
        assetType: PurchaseAssetType.STOCK,
        quantity: 5,
        purchasePrice: Money.of(160, 'USD'),
        purchasedAt: new Date('2026-01-10T00:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(PurchaseNotFoundError);
  });
});
