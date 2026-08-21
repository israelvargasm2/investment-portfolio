import { Money } from '../../../shared/domain/value-objects/money.vo';
import { Purchase } from '../../domain/entities/purchase.entity';
import { InvalidPurchaseDateError } from '../../domain/errors/invalid-purchase-date.error';
import { PurchaseRepositoryPort } from '../../domain/ports/purchase-repository.port';
import { PurchaseAssetType } from '../../domain/purchase-asset-type.enum';
import { CreatePurchaseUseCase } from './create-purchase.use-case';

describe('CreatePurchaseUseCase', () => {
  let purchaseRepository: jest.Mocked<PurchaseRepositoryPort>;
  let useCase: CreatePurchaseUseCase;

  beforeEach(() => {
    purchaseRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      updateByIdAndUserId: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
    };
    useCase = new CreatePurchaseUseCase(purchaseRepository);
  });

  it('crea la compra cuando la fecha no es futura', async () => {
    const newPurchase = {
      userId: 'user-1',
      assetSymbol: 'AAPL',
      assetType: PurchaseAssetType.STOCK,
      quantity: 10,
      purchasePrice: Money.of(150, 'USD'),
      purchasedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const createdPurchase = new Purchase(
      'purchase-1',
      'user-1',
      'AAPL',
      PurchaseAssetType.STOCK,
      10,
      Money.of(150, 'USD'),
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-01-01T00:00:00.000Z'),
    );
    purchaseRepository.create.mockResolvedValue(createdPurchase);

    const result = await useCase.execute(newPurchase);

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(purchaseRepository.create).toHaveBeenCalledWith(newPurchase);
    expect(result).toBe(createdPurchase);
  });

  it('lanza InvalidPurchaseDateError cuando la fecha de compra es futura', async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await expect(
      useCase.execute({
        userId: 'user-1',
        assetSymbol: 'AAPL',
        assetType: PurchaseAssetType.STOCK,
        quantity: 10,
        purchasePrice: Money.of(150, 'USD'),
        purchasedAt: futureDate,
      }),
    ).rejects.toBeInstanceOf(InvalidPurchaseDateError);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(purchaseRepository.create).not.toHaveBeenCalled();
  });
});
