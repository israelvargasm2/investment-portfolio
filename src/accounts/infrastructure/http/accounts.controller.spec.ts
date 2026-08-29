import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateAccountUseCase } from '../../application/create-account/create-account.use-case';
import { ListAccountsUseCase } from '../../application/list-accounts/list-accounts.use-case';
import { RemoveAccountUseCase } from '../../application/remove-account/remove-account.use-case';
import { UpdateAccountUseCase } from '../../application/update-account/update-account.use-case';
import { Account } from '../../domain/entities/account.entity';
import { AccountTerm } from '../../domain/account-term.enum';
import { AccountNotFoundError } from '../../domain/errors/account-not-found.error';
import { InvalidRateTiersError } from '../../domain/errors/invalid-rate-tiers.error';
import { InstitutionType } from '../../domain/institution-type.enum';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { AccountsController } from './accounts.controller';

describe('AccountsController', () => {
  let createAccount: jest.Mocked<CreateAccountUseCase>;
  let listAccounts: jest.Mocked<ListAccountsUseCase>;
  let updateAccount: jest.Mocked<UpdateAccountUseCase>;
  let removeAccount: jest.Mocked<RemoveAccountUseCase>;
  let controller: AccountsController;

  const currentUser = { id: 'user-1', email: 'ada@example.com' };
  const dtoBody = {
    institutionName: 'BBVA',
    institutionType: InstitutionType.BANK,
    balanceAmount: 10000,
    currency: 'MXN',
    rateTiers: [{ upToAmount: null, annualRate: 8.5 }],
    term: AccountTerm.LONG,
  };

  beforeEach(() => {
    createAccount = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateAccountUseCase>;
    listAccounts = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ListAccountsUseCase>;
    updateAccount = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateAccountUseCase>;
    removeAccount = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RemoveAccountUseCase>;
    controller = new AccountsController(
      createAccount,
      listAccounts,
      updateAccount,
      removeAccount,
    );
  });

  it('crea la cuenta usando el id del usuario autenticado y construye el Money desde el DTO', async () => {
    const account = new Account(
      'account-1',
      'user-1',
      'BBVA',
      InstitutionType.BANK,
      Money.of(10000, 'MXN'),
      [{ upToAmount: null, annualRate: 8.5 }],
      AccountTerm.LONG,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    createAccount.execute.mockResolvedValue(account);

    const response = await controller.create(currentUser, dtoBody);

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(createAccount.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      institutionName: 'BBVA',
      institutionType: InstitutionType.BANK,
      balance: Money.of(10000, 'MXN'),
      rateTiers: [{ upToAmount: null, annualRate: 8.5 }],
      term: AccountTerm.LONG,
    });
    expect(response.id).toBe('account-1');
    expect(response.currency).toBe('MXN');
    expect(response.estimatedAnnualYield).toBeCloseTo(850);
    expect(response.effectiveAnnualRate).toBeCloseTo(8.5);
  });

  it('traduce InvalidRateTiersError a BadRequestException (400) al crear', async () => {
    createAccount.execute.mockRejectedValue(
      new InvalidRateTiersError('bad tiers'),
    );

    await expect(controller.create(currentUser, dtoBody)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('devuelve las cuentas del usuario autenticado mapeadas al DTO', async () => {
    const account = new Account(
      'account-1',
      'user-1',
      'BBVA',
      InstitutionType.BANK,
      Money.of(10000, 'MXN'),
      [{ upToAmount: null, annualRate: 8.5 }],
      AccountTerm.LONG,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    listAccounts.execute.mockResolvedValue([account]);

    const response = await controller.list(currentUser);

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(listAccounts.execute).toHaveBeenCalledWith('user-1');
    expect(response.accounts).toHaveLength(1);
    expect(response.accounts[0].institutionName).toBe('BBVA');
  });

  it('suma el rendimiento anual y el mensual del total de cuentas, por separado', async () => {
    const accountA = new Account(
      'account-1',
      'user-1',
      'BBVA',
      InstitutionType.BANK,
      Money.of(10000, 'MXN'),
      [{ upToAmount: null, annualRate: 8.5 }], // 850 anual
      AccountTerm.LONG,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    const accountB = new Account(
      'account-2',
      'user-1',
      'Klar',
      InstitutionType.SOFIPO,
      Money.of(30000, 'MXN'),
      [
        { upToAmount: 25000, annualRate: 15 },
        { upToAmount: null, annualRate: 6 },
      ], // 4050 anual
      AccountTerm.LONG,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    listAccounts.execute.mockResolvedValue([accountA, accountB]);

    const response = await controller.list(currentUser);

    // 850 + 4050 = 4900
    expect(response.totalAnnualYield).toBeCloseTo(4900);
    // 4900 / 12, no la suma junto con el anual
    expect(response.totalMonthlyYield).toBeCloseTo(4900 / 12);
  });

  it('edita la cuenta usando el id del usuario autenticado, con varios tramos', async () => {
    const tiers = [
      { upToAmount: 25000, annualRate: 15 },
      { upToAmount: null, annualRate: 6 },
    ];
    const account = new Account(
      'account-1',
      'user-1',
      'Klar',
      InstitutionType.SOFIPO,
      Money.of(30000, 'MXN'),
      tiers,
      AccountTerm.LONG,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    updateAccount.execute.mockResolvedValue(account);

    const response = await controller.update(currentUser, 'account-1', {
      ...dtoBody,
      institutionName: 'Klar',
      institutionType: InstitutionType.SOFIPO,
      balanceAmount: 30000,
      rateTiers: tiers,
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(updateAccount.execute).toHaveBeenCalledWith('account-1', 'user-1', {
      institutionName: 'Klar',
      institutionType: InstitutionType.SOFIPO,
      balance: Money.of(30000, 'MXN'),
      rateTiers: tiers,
      term: AccountTerm.LONG,
    });
    expect(response.institutionName).toBe('Klar');
    // 25000*0.15 + 5000*0.06 = 3750 + 300 = 4050
    expect(response.estimatedAnnualYield).toBeCloseTo(4050);
  });

  it('traduce InvalidRateTiersError a BadRequestException (400) al editar', async () => {
    updateAccount.execute.mockRejectedValue(
      new InvalidRateTiersError('bad tiers'),
    );

    await expect(
      controller.update(currentUser, 'account-1', dtoBody),
    ).rejects.toThrow(BadRequestException);
  });

  it('traduce AccountNotFoundError a NotFoundException (404) al editar', async () => {
    updateAccount.execute.mockRejectedValue(
      new AccountNotFoundError('account-1'),
    );

    await expect(
      controller.update(currentUser, 'account-1', dtoBody),
    ).rejects.toThrow(NotFoundException);
  });

  it('quita una cuenta del usuario autenticado', async () => {
    removeAccount.execute.mockResolvedValue(undefined);

    await controller.remove(currentUser, 'account-1');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(removeAccount.execute).toHaveBeenCalledWith('account-1', 'user-1');
  });

  it('traduce AccountNotFoundError a NotFoundException (404) al quitar', async () => {
    removeAccount.execute.mockRejectedValue(
      new AccountNotFoundError('account-1'),
    );

    await expect(controller.remove(currentUser, 'account-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
