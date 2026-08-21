import { User } from '../../domain/entities/user.entity';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { GetUserProfileUseCase } from './get-user-profile.use-case';

describe('GetUserProfileUseCase', () => {
  let userRepository: jest.Mocked<UserRepositoryPort>;
  let useCase: GetUserProfileUseCase;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByGoogleId: jest.fn(),
      create: jest.fn(),
    };
    useCase = new GetUserProfileUseCase(userRepository);
  });

  it('devuelve el perfil del usuario cuando existe', async () => {
    const user = new User(
      'user-1',
      'google-123',
      'ada@example.com',
      'Ada Lovelace',
      null,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    userRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute('user-1');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(userRepository.findById).toHaveBeenCalledWith('user-1');
    expect(result).toBe(user);
  });

  it('devuelve null cuando el usuario no existe', async () => {
    userRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute('unknown');

    expect(result).toBeNull();
  });
});
