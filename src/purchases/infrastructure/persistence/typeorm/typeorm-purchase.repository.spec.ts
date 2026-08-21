import { Repository } from 'typeorm';
import { Money } from '../../../../shared/domain/value-objects/money.vo';
import { PurchaseAssetType } from '../../../domain/purchase-asset-type.enum';
import { PurchaseOrmEntity } from './purchase.orm-entity';
import { TypeOrmPurchaseRepository } from './typeorm-purchase.repository';

describe('TypeOrmPurchaseRepository', () => {
  let repository: jest.Mocked<Repository<PurchaseOrmEntity>>;
  let purchaseRepository: TypeOrmPurchaseRepository;

  const row: PurchaseOrmEntity = {
    id: 'purchase-1',
    userId: 'user-1',
    assetSymbol: 'AAPL',
    assetType: PurchaseAssetType.STOCK,
    quantity: 10,
    purchasePriceAmount: 150,
    purchasePriceCurrency: 'USD',
    purchasedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<PurchaseOrmEntity>>;
    purchaseRepository = new TypeOrmPurchaseRepository(repository);
  });

  it('lista y mapea las compras del usuario, con Money reconstruido', async () => {
    repository.find.mockResolvedValue([row]);

    const result = await purchaseRepository.findByUserId('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].purchasePrice.amount).toBe(150);
    expect(result[0].purchasePrice.currency).toBe('USD');
  });

  it('crea y guarda una compra nueva, separando el Money en dos columnas', async () => {
    repository.create.mockReturnValue(row);
    repository.save.mockResolvedValue(row);

    const result = await purchaseRepository.create({
      userId: 'user-1',
      assetSymbol: 'AAPL',
      assetType: PurchaseAssetType.STOCK,
      quantity: 10,
      purchasePrice: Money.of(150, 'USD'),
      purchasedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(repository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      assetSymbol: 'AAPL',
      assetType: PurchaseAssetType.STOCK,
      quantity: 10,
      purchasePriceAmount: 150,
      purchasePriceCurrency: 'USD',
      purchasedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    expect(result.id).toBe('purchase-1');
  });

  it('actualiza la compra y devuelve la entidad mapeada cuando pertenece al usuario', async () => {
    repository.update.mockResolvedValue({
      affected: 1,
      raw: {},
      generatedMaps: [],
    });
    repository.findOne.mockResolvedValue({
      ...row,
      quantity: 5,
      purchasePriceAmount: 160,
    });

    const result = await purchaseRepository.updateByIdAndUserId(
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

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(repository.update).toHaveBeenCalledWith(
      { id: 'purchase-1', userId: 'user-1' },
      {
        assetSymbol: 'AAPL',
        assetType: PurchaseAssetType.STOCK,
        quantity: 5,
        purchasePriceAmount: 160,
        purchasePriceCurrency: 'USD',
        purchasedAt: new Date('2026-01-10T00:00:00.000Z'),
      },
    );
    expect(result?.quantity).toBe(5);
  });

  it('devuelve null al actualizar cuando la compra no existe o no pertenece al usuario', async () => {
    repository.update.mockResolvedValue({
      affected: 0,
      raw: {},
      generatedMaps: [],
    });

    const result = await purchaseRepository.updateByIdAndUserId(
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

    expect(result).toBeNull();
  });

  it('devuelve true al borrar cuando la compra pertenece al usuario', async () => {
    repository.delete.mockResolvedValue({ affected: 1, raw: {} });

    const result = await purchaseRepository.deleteByIdAndUserId(
      'purchase-1',
      'user-1',
    );

    expect(result).toBe(true);
  });

  it('devuelve false al borrar cuando la compra no existe o no pertenece al usuario', async () => {
    repository.delete.mockResolvedValue({ affected: 0, raw: {} });

    const result = await purchaseRepository.deleteByIdAndUserId(
      'purchase-1',
      'user-1',
    );

    expect(result).toBe(false);
  });
});
