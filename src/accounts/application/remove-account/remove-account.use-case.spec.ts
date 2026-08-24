import { AccountNotFoundError } from '../../domain/errors/account-not-found.error';
import type { AccountRepositoryPort } from '../../domain/ports/account-repository.port';
import { RemoveAccountUseCase } from './remove-account.use-case';

describe('RemoveAccountUseCase', () => {
  let accountRepository: jest.Mocked<AccountRepositoryPort>;
  let useCase: RemoveAccountUseCase;

  beforeEach(() => {
    accountRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      updateByIdAndUserId: jest.fn(),
      deleteByIdAndUserId: jest.fn(),
    };
    useCase = new RemoveAccountUseCase(accountRepository);
  });

  it('elimina la cuenta cuando el repositorio confirma el borrado', async () => {
    accountRepository.deleteByIdAndUserId.mockResolvedValue(true);

    await expect(
      useCase.execute('account-1', 'user-1'),
    ).resolves.toBeUndefined();
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(accountRepository.deleteByIdAndUserId).toHaveBeenCalledWith(
      'account-1',
      'user-1',
    );
  });

  it('lanza AccountNotFoundError si no se borró nada', async () => {
    accountRepository.deleteByIdAndUserId.mockResolvedValue(false);

    await expect(useCase.execute('missing-account', 'user-1')).rejects.toThrow(
      AccountNotFoundError,
    );
  });
});
