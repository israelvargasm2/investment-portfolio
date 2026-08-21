import { User } from '../../domain/entities/user.entity';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { FindOrCreateUserByGoogleProfileUseCase } from './find-or-create-user-by-google-profile.use-case';
import { GoogleUserProfile } from './google-user-profile';

describe('FindOrCreateUserByGoogleProfileUseCase', () => {
  let userRepository: jest.Mocked<UserRepositoryPort>;
  let useCase: FindOrCreateUserByGoogleProfileUseCase;

  const profile: GoogleUserProfile = {
    googleId: 'google-123',
    email: 'ada@example.com',
    fullName: 'Ada Lovelace',
    avatarUrl: 'https://example.com/avatar.png',
  };

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByGoogleId: jest.fn(),
      create: jest.fn(),
    };
    useCase = new FindOrCreateUserByGoogleProfileUseCase(userRepository);
  });

  it('devuelve el usuario existente sin crear uno nuevo cuando ya existe por googleId', async () => {
    const existingUser = new User(
      'user-1',
      'google-123',
      'ada@example.com',
      'Ada Lovelace',
      null,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    userRepository.findByGoogleId.mockResolvedValue(existingUser);

    const result = await useCase.execute(profile);

    expect(result).toBe(existingUser);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('crea un usuario nuevo cuando no existe ninguno con ese googleId', async () => {
    userRepository.findByGoogleId.mockResolvedValue(null);
    const createdUser = new User(
      'user-2',
      'google-123',
      'ada@example.com',
      'Ada Lovelace',
      'https://example.com/avatar.png',
      new Date('2026-01-01T00:00:00.000Z'),
    );
    userRepository.create.mockResolvedValue(createdUser);

    const result = await useCase.execute(profile);

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(userRepository.create).toHaveBeenCalledWith({
      googleId: 'google-123',
      email: 'ada@example.com',
      fullName: 'Ada Lovelace',
      avatarUrl: 'https://example.com/avatar.png',
    });
    expect(result).toBe(createdUser);
  });
});
