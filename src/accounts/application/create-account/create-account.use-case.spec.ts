import { Account } from '../../domain/entities/account.entity';
import { InvalidRateTiersError } from '../../domain/errors/invalid-rate-tiers.error';
import { InstitutionType } from '../../domain/institution-type.enum';
import type { AccountRepositoryPort } from '../../domain/ports/account-repository.port';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { CreateAccountUseCase } from './create-account.use-case';

describe('CreateAccountUseCase', () => {
  let accountRepository: jest.Mocked<AccountRepositoryPort>;
  let useCase: CreateAccountUseCase;

  beforeEach(() => {
    accountRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      updateByIdAndUserId: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
    };
    useCase = new CreateAccountUseCase(accountRepository);
  });

  it('delega la creación en el repositorio', async () => {
    const account = new Account(
      'account-1',
      'user-1',
      'Nu México',
      InstitutionType.SOFIPO,
      Money.of(50000, 'MXN'),
      [{ upToAmount: null, annualRate: 15 }],
      new Date('2026-01-01T00:00:00.000Z'),
    );
    accountRepository.create.mockResolvedValue(account);

    const result = await useCase.execute({
      userId: 'user-1',
      institutionName: 'Nu México',
      institutionType: InstitutionType.SOFIPO,
      balance: Money.of(50000, 'MXN'),
      rateTiers: [{ upToAmount: null, annualRate: 15 }],
    });

    expect(result).toBe(account);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(accountRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      institutionName: 'Nu México',
      institutionType: InstitutionType.SOFIPO,
      balance: Money.of(50000, 'MXN'),
      rateTiers: [{ upToAmount: null, annualRate: 15 }],
    });
  });

  it('lanza InvalidRateTiersError si los tramos son inválidos, sin llegar al repositorio', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        institutionName: 'Nu México',
        institutionType: InstitutionType.SOFIPO,
        balance: Money.of(50000, 'MXN'),
        rateTiers: [],
      }),
    ).rejects.toThrow(InvalidRateTiersError);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(accountRepository.create).not.toHaveBeenCalled();
  });
});
