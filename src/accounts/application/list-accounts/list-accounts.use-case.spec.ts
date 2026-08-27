import { Account } from '../../domain/entities/account.entity';
import { AccountTerm } from '../../domain/account-term.enum';
import { InstitutionType } from '../../domain/institution-type.enum';
import type { AccountRepositoryPort } from '../../domain/ports/account-repository.port';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { ListAccountsUseCase } from './list-accounts.use-case';

describe('ListAccountsUseCase', () => {
  let accountRepository: jest.Mocked<AccountRepositoryPort>;
  let useCase: ListAccountsUseCase;

  beforeEach(() => {
    accountRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      updateByIdAndUserId: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
    };
    useCase = new ListAccountsUseCase(accountRepository);
  });

  it('devuelve las cuentas del usuario', async () => {
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
    accountRepository.findByUserId.mockResolvedValue([account]);

    const result = await useCase.execute('user-1');

    expect(result).toEqual([account]);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(accountRepository.findByUserId).toHaveBeenCalledWith('user-1');
  });
});
