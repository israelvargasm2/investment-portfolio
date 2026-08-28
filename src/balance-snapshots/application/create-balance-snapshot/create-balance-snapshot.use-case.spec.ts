import { Account } from '../../../accounts/domain/entities/account.entity';
import { AccountTerm } from '../../../accounts/domain/account-term.enum';
import { InstitutionType } from '../../../accounts/domain/institution-type.enum';
import type { AccountRepositoryPort } from '../../../accounts/domain/ports/account-repository.port';
import type { CurrencyConverterPort } from '../../../market-data/domain/ports/currency-converter.port';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { BalanceSnapshotScope } from '../../domain/balance-snapshot-scope.enum';
import { BalanceSnapshot } from '../../domain/entities/balance-snapshot.entity';
import { BalanceSnapshotCalculationError } from '../../domain/errors/balance-snapshot-calculation.error';
import type { BalanceSnapshotRepositoryPort } from '../../domain/ports/balance-snapshot-repository.port';
import { CreateBalanceSnapshotUseCase } from './create-balance-snapshot.use-case';

describe('CreateBalanceSnapshotUseCase', () => {
  let accountRepository: jest.Mocked<AccountRepositoryPort>;
  let currencyConverter: jest.Mocked<CurrencyConverterPort>;
  let snapshotRepository: jest.Mocked<BalanceSnapshotRepositoryPort>;
  let useCase: CreateBalanceSnapshotUseCase;

  const usdAccount = new Account(
    'account-1',
    'user-1',
    'BBVA',
    InstitutionType.BANK,
    Money.of(1000, 'USD'),
    [{ upToAmount: null, annualRate: 5 }],
    AccountTerm.LONG,
    new Date('2026-01-01T00:00:00.000Z'),
  );
  const mxnAccount = new Account(
    'account-2',
    'user-1',
    'Klar',
    InstitutionType.SOFIPO,
    Money.of(5000, 'MXN'),
    [{ upToAmount: null, annualRate: 13 }],
    AccountTerm.LONG,
    new Date('2026-01-01T00:00:00.000Z'),
  );

  beforeEach(() => {
    accountRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      updateByIdAndUserId: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
    };
    currencyConverter = { convert: jest.fn() };
    snapshotRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
    };
    useCase = new CreateBalanceSnapshotUseCase(
      accountRepository,
      currencyConverter,
      snapshotRepository,
    );
  });

  it('suma las cuentas ya en la moneda destino sin convertir', async () => {
    accountRepository.findByUserId.mockResolvedValue([usdAccount]);
    const snapshot = new BalanceSnapshot(
      'snap-1',
      'user-1',
      Money.of(1000, 'USD'),
      BalanceSnapshotScope.ALL,
      new Date(),
    );
    snapshotRepository.create.mockResolvedValue(snapshot);

    const result = await useCase.execute(
      'user-1',
      'usd',
      BalanceSnapshotScope.ALL,
    );

    expect(result).toBe(snapshot);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(currencyConverter.convert).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(snapshotRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      total: Money.of(1000, 'USD'),
      scope: BalanceSnapshotScope.ALL,
    });
  });

  it('convierte cada cuenta que no está en la moneda destino y suma todo', async () => {
    accountRepository.findByUserId.mockResolvedValue([usdAccount, mxnAccount]);
    currencyConverter.convert.mockResolvedValue(270); // 5000 MXN -> 270 USD
    snapshotRepository.create.mockResolvedValue(
      new BalanceSnapshot(
        'snap-1',
        'user-1',
        Money.of(1270, 'USD'),
        BalanceSnapshotScope.ALL,
        new Date(),
      ),
    );

    await useCase.execute('user-1', 'USD', BalanceSnapshotScope.ALL);

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(currencyConverter.convert).toHaveBeenCalledWith(5000, 'MXN', 'USD');
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(snapshotRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      total: Money.of(1270, 'USD'),
      scope: BalanceSnapshotScope.ALL,
    });
  });

  it('guarda 0 si el usuario todavía no tiene cuentas', async () => {
    accountRepository.findByUserId.mockResolvedValue([]);
    snapshotRepository.create.mockResolvedValue(
      new BalanceSnapshot(
        'snap-1',
        'user-1',
        Money.of(0, 'USD'),
        BalanceSnapshotScope.ALL,
        new Date(),
      ),
    );

    await useCase.execute('user-1', 'USD', BalanceSnapshotScope.ALL);

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(snapshotRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      total: Money.of(0, 'USD'),
      scope: BalanceSnapshotScope.ALL,
    });
  });

  it('lanza BalanceSnapshotCalculationError si falla la conversión, sin guardar nada', async () => {
    accountRepository.findByUserId.mockResolvedValue([mxnAccount]);
    currencyConverter.convert.mockRejectedValue(new Error('Frankfurter down'));

    await expect(
      useCase.execute('user-1', 'USD', BalanceSnapshotScope.ALL),
    ).rejects.toThrow(BalanceSnapshotCalculationError);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(snapshotRepository.create).not.toHaveBeenCalled();
  });

  it('con scope SHORT, solo suma las cuentas de corto plazo', async () => {
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
    accountRepository.findByUserId.mockResolvedValue([
      usdAccount,
      shortAccount,
    ]); // usdAccount es LONG
    snapshotRepository.create.mockResolvedValue(
      new BalanceSnapshot(
        'snap-1',
        'user-1',
        Money.of(2000, 'USD'),
        BalanceSnapshotScope.SHORT,
        new Date(),
      ),
    );

    await useCase.execute('user-1', 'USD', BalanceSnapshotScope.SHORT);

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(snapshotRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      total: Money.of(2000, 'USD'),
      scope: BalanceSnapshotScope.SHORT,
    });
  });

  it('con scope LONG_MEDIUM, suma largo y mediano juntos, sin las de corto plazo', async () => {
    const mediumAccount = new Account(
      'account-3',
      'user-1',
      'Klar plazo fijo',
      InstitutionType.SOFIPO,
      Money.of(500, 'USD'),
      [{ upToAmount: null, annualRate: 10 }],
      AccountTerm.MEDIUM,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    const shortAccount = new Account(
      'account-4',
      'user-1',
      'Cuenta de ahorro',
      InstitutionType.BANK,
      Money.of(2000, 'USD'),
      [{ upToAmount: null, annualRate: 0 }],
      AccountTerm.SHORT,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    accountRepository.findByUserId.mockResolvedValue([
      usdAccount,
      mediumAccount,
      shortAccount,
    ]); // usdAccount es LONG
    snapshotRepository.create.mockResolvedValue(
      new BalanceSnapshot(
        'snap-1',
        'user-1',
        Money.of(1500, 'USD'),
        BalanceSnapshotScope.LONG_MEDIUM,
        new Date(),
      ),
    );

    await useCase.execute('user-1', 'USD', BalanceSnapshotScope.LONG_MEDIUM);

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(snapshotRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      total: Money.of(1500, 'USD'), // 1000 (long) + 500 (medium), sin las 2000 de short
      scope: BalanceSnapshotScope.LONG_MEDIUM,
    });
  });
});
