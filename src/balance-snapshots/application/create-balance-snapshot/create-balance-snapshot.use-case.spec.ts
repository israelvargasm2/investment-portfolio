import { Account } from '../../../accounts/domain/entities/account.entity';
import { AccountTerm } from '../../../accounts/domain/account-term.enum';
import { InstitutionType } from '../../../accounts/domain/institution-type.enum';
import type { AccountRepositoryPort } from '../../../accounts/domain/ports/account-repository.port';
import type { CurrencyConverterPort } from '../../../market-data/domain/ports/currency-converter.port';
import { GetPurchasesPerformanceUseCase } from '../../../purchases/application/get-purchases-performance/get-purchases-performance.use-case';
import { PurchasePerformance } from '../../../purchases/application/get-purchases-performance/purchase-performance';
import { Purchase } from '../../../purchases/domain/entities/purchase.entity';
import { PurchaseAssetType } from '../../../purchases/domain/purchase-asset-type.enum';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { BalanceSnapshot } from '../../domain/entities/balance-snapshot.entity';
import { BalanceSnapshotCalculationError } from '../../domain/errors/balance-snapshot-calculation.error';
import type { BalanceSnapshotRepositoryPort } from '../../domain/ports/balance-snapshot-repository.port';
import { CreateBalanceSnapshotUseCase } from './create-balance-snapshot.use-case';

describe('CreateBalanceSnapshotUseCase', () => {
  let accountRepository: jest.Mocked<AccountRepositoryPort>;
  let getPurchasesPerformance: jest.Mocked<GetPurchasesPerformanceUseCase>;
  let currencyConverter: jest.Mocked<CurrencyConverterPort>;
  let snapshotRepository: jest.Mocked<BalanceSnapshotRepositoryPort>;
  let useCase: CreateBalanceSnapshotUseCase;

  const longAccount = new Account(
    'account-1',
    'user-1',
    'BBVA',
    InstitutionType.BANK,
    Money.of(1000, 'USD'),
    [{ upToAmount: null, annualRate: 5 }],
    AccountTerm.LONG,
    new Date('2026-01-01T00:00:00.000Z'),
  );
  const mediumAccount = new Account(
    'account-2',
    'user-1',
    'Klar plazo fijo',
    InstitutionType.SOFIPO,
    Money.of(500, 'USD'),
    [{ upToAmount: null, annualRate: 10 }],
    AccountTerm.MEDIUM,
    new Date('2026-01-01T00:00:00.000Z'),
  );
  const shortAccount = new Account(
    'account-3',
    'user-1',
    'Cuenta de ahorro',
    InstitutionType.BANK,
    Money.of(2000, 'USD'),
    [{ upToAmount: null, annualRate: 0 }],
    AccountTerm.SHORT,
    new Date('2026-01-01T00:00:00.000Z'),
  );
  const mxnAccount = new Account(
    'account-4',
    'user-1',
    'Klar',
    InstitutionType.SOFIPO,
    Money.of(5000, 'MXN'),
    [{ upToAmount: null, annualRate: 13 }],
    AccountTerm.LONG,
    new Date('2026-01-01T00:00:00.000Z'),
  );

  function buildPerformance(
    currentValue: number,
    assetType: PurchaseAssetType,
  ): PurchasePerformance {
    return {
      purchase: new Purchase(
        'purchase-1',
        'user-1',
        assetType === PurchaseAssetType.STOCK ? 'AAPL' : 'bitcoin',
        assetType,
        1,
        Money.of(1000, 'USD'),
        new Date('2026-01-01T00:00:00.000Z'),
        new Date('2026-01-01T00:00:00.000Z'),
      ),
      investedAmountUsd: 1000,
      currentPrice: Money.of(currentValue, 'USD'),
      currentValue,
      gainLoss: currentValue - 1000,
      gainLossPercentage: 0,
    };
  }

  beforeEach(() => {
    accountRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      updateByIdAndUserId: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
    };
    getPurchasesPerformance = {
      execute: jest.fn().mockResolvedValue({ performances: [], errors: [] }),
    } as unknown as jest.Mocked<GetPurchasesPerformanceUseCase>;
    currencyConverter = { convert: jest.fn() };
    snapshotRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
    };
    useCase = new CreateBalanceSnapshotUseCase(
      accountRepository,
      getPurchasesPerformance,
      currencyConverter,
      snapshotRepository,
    );
  });

  it('guarda un solo registro con total, largo+mediano y corto plazo separados', async () => {
    accountRepository.findByUserId.mockResolvedValue([
      longAccount,
      mediumAccount,
      shortAccount,
    ]);
    const snapshot = new BalanceSnapshot(
      'snap-1',
      'user-1',
      Money.of(3500, 'USD'),
      Money.of(1500, 'USD'),
      Money.of(2000, 'USD'),
      new Date(),
    );
    snapshotRepository.create.mockResolvedValue(snapshot);

    const result = await useCase.execute('user-1', 'usd');

    expect(result).toBe(snapshot);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(currencyConverter.convert).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(snapshotRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      totalAmount: Money.of(3500, 'USD'), // 1000 (long) + 500 (medium) + 2000 (short)
      longMediumTermAmount: Money.of(1500, 'USD'),
      shortTermAmount: Money.of(2000, 'USD'),
    });
  });

  it('convierte cuentas en otra moneda antes de sumarlas', async () => {
    accountRepository.findByUserId.mockResolvedValue([longAccount, mxnAccount]);
    currencyConverter.convert.mockResolvedValue(270); // 5000 MXN -> 270 USD
    snapshotRepository.create.mockResolvedValue(
      new BalanceSnapshot(
        'snap-1',
        'user-1',
        Money.of(1270, 'USD'),
        Money.of(1270, 'USD'),
        Money.of(0, 'USD'),
        new Date(),
      ),
    );

    await useCase.execute('user-1', 'USD');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(currencyConverter.convert).toHaveBeenCalledWith(5000, 'MXN', 'USD');
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(snapshotRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      totalAmount: Money.of(1270, 'USD'),
      longMediumTermAmount: Money.of(1270, 'USD'),
      shortTermAmount: Money.of(0, 'USD'),
    });
  });

  it('guarda todo en 0 si el usuario no tiene cuentas ni compras', async () => {
    accountRepository.findByUserId.mockResolvedValue([]);
    snapshotRepository.create.mockResolvedValue(
      new BalanceSnapshot(
        'snap-1',
        'user-1',
        Money.of(0, 'USD'),
        Money.of(0, 'USD'),
        Money.of(0, 'USD'),
        new Date(),
      ),
    );

    await useCase.execute('user-1', 'USD');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(snapshotRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      totalAmount: Money.of(0, 'USD'),
      longMediumTermAmount: Money.of(0, 'USD'),
      shortTermAmount: Money.of(0, 'USD'),
    });
  });

  it('lanza BalanceSnapshotCalculationError si falla la conversión, sin guardar nada', async () => {
    accountRepository.findByUserId.mockResolvedValue([mxnAccount]);
    currencyConverter.convert.mockRejectedValue(new Error('Frankfurter down'));

    await expect(useCase.execute('user-1', 'USD')).rejects.toThrow(
      BalanceSnapshotCalculationError,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(snapshotRepository.create).not.toHaveBeenCalled();
  });

  it('incluye el valor actual de stocks y cripto dentro del monto de largo+mediano plazo', async () => {
    accountRepository.findByUserId.mockResolvedValue([shortAccount]);
    getPurchasesPerformance.execute.mockResolvedValue({
      performances: [
        buildPerformance(500, PurchaseAssetType.STOCK),
        buildPerformance(300, PurchaseAssetType.CRYPTO),
      ],
      errors: [],
    });
    snapshotRepository.create.mockResolvedValue(
      new BalanceSnapshot(
        'snap-1',
        'user-1',
        Money.of(2800, 'USD'),
        Money.of(800, 'USD'),
        Money.of(2000, 'USD'),
        new Date(),
      ),
    );

    await useCase.execute('user-1', 'USD');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(snapshotRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      // shortTerm: 2000 (shortAccount). longMedium: 500 (stock) + 300 (cripto), sin cuentas de ese plazo.
      totalAmount: Money.of(2800, 'USD'),
      longMediumTermAmount: Money.of(800, 'USD'),
      shortTermAmount: Money.of(2000, 'USD'),
    });
  });

  it('convierte el valor de stocks/cripto a la moneda pedida', async () => {
    accountRepository.findByUserId.mockResolvedValue([]);
    getPurchasesPerformance.execute.mockResolvedValue({
      performances: [buildPerformance(100, PurchaseAssetType.STOCK)],
      errors: [],
    });
    currencyConverter.convert.mockResolvedValue(1850); // 100 USD -> 1850 MXN
    snapshotRepository.create.mockResolvedValue(
      new BalanceSnapshot(
        'snap-1',
        'user-1',
        Money.of(1850, 'MXN'),
        Money.of(1850, 'MXN'),
        Money.of(0, 'MXN'),
        new Date(),
      ),
    );

    await useCase.execute('user-1', 'MXN');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(currencyConverter.convert).toHaveBeenCalledWith(100, 'USD', 'MXN');
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(snapshotRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      totalAmount: Money.of(1850, 'MXN'),
      longMediumTermAmount: Money.of(1850, 'MXN'),
      shortTermAmount: Money.of(0, 'MXN'),
    });
  });
});
