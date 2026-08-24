import { Account } from '../../domain/entities/account.entity';
import { AccountNotFoundError } from '../../domain/errors/account-not-found.error';
import { InvalidRateTiersError } from '../../domain/errors/invalid-rate-tiers.error';
import { InstitutionType } from '../../domain/institution-type.enum';
import type { AccountRepositoryPort } from '../../domain/ports/account-repository.port';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { UpdateAccountUseCase } from './update-account.use-case';

describe('UpdateAccountUseCase', () => {
  let accountRepository: jest.Mocked<AccountRepositoryPort>;
  let useCase: UpdateAccountUseCase;

  beforeEach(() => {
    accountRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      updateByIdAndUserId: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
    };
    useCase = new UpdateAccountUseCase(accountRepository);
  });

  it('devuelve la cuenta actualizada', async () => {
    const account = new Account(
      'account-1',
      'user-1',
      'Klar',
      InstitutionType.SOFIPO,
      Money.of(20000, 'MXN'),
      [{ upToAmount: null, annualRate: 13 }],
      new Date('2026-01-01T00:00:00.000Z'),
    );
    accountRepository.updateByIdAndUserId.mockResolvedValue(account);

    const result = await useCase.execute('account-1', 'user-1', {
      institutionName: 'Klar',
      institutionType: InstitutionType.SOFIPO,
      balance: Money.of(20000, 'MXN'),
      rateTiers: [{ upToAmount: null, annualRate: 13 }],
    });

    expect(result).toBe(account);
  });

  it('lanza AccountNotFoundError si el repositorio no encuentra la cuenta', async () => {
    accountRepository.updateByIdAndUserId.mockResolvedValue(null);

    await expect(
      useCase.execute('missing-account', 'user-1', {
        institutionName: 'Klar',
        institutionType: InstitutionType.SOFIPO,
        balance: Money.of(20000, 'MXN'),
        rateTiers: [{ upToAmount: null, annualRate: 13 }],
      }),
    ).rejects.toThrow(AccountNotFoundError);
  });

  it('lanza InvalidRateTiersError si los tramos son inválidos, sin llegar al repositorio', async () => {
    await expect(
      useCase.execute('account-1', 'user-1', {
        institutionName: 'Klar',
        institutionType: InstitutionType.SOFIPO,
        balance: Money.of(20000, 'MXN'),
        rateTiers: [
          { upToAmount: 10000, annualRate: 15 },
          { upToAmount: 5000, annualRate: 6 },
        ],
      }),
    ).rejects.toThrow(InvalidRateTiersError);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(accountRepository.updateByIdAndUserId).not.toHaveBeenCalled();
  });
});
