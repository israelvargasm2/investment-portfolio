import { PurchaseNotFoundError } from '../../domain/errors/purchase-not-found.error';
import { PurchaseRepositoryPort } from '../../domain/ports/purchase-repository.port';
import { RemovePurchaseUseCase } from './remove-purchase.use-case';

describe('RemovePurchaseUseCase', () => {
  let purchaseRepository: jest.Mocked<PurchaseRepositoryPort>;
  let useCase: RemovePurchaseUseCase;

  beforeEach(() => {
    purchaseRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      updateByIdAndUserId: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
    };
    useCase = new RemovePurchaseUseCase(purchaseRepository);
  });

  it('borra la compra cuando pertenece al usuario', async () => {
    purchaseRepository.deleteByIdAndUserId.mockResolvedValue(true);

    await expect(
      useCase.execute('purchase-1', 'user-1'),
    ).resolves.toBeUndefined();
  });

  it('lanza PurchaseNotFoundError cuando no existe o no pertenece al usuario', async () => {
    purchaseRepository.deleteByIdAndUserId.mockResolvedValue(false);

    await expect(
      useCase.execute('purchase-1', 'user-1'),
    ).rejects.toBeInstanceOf(PurchaseNotFoundError);
  });
});
