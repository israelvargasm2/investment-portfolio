import { Repository } from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';
import { TypeOrmUserRepository } from './typeorm-user.repository';

describe('TypeOrmUserRepository', () => {
  let repository: jest.Mocked<Repository<UserOrmEntity>>;
  let userRepository: TypeOrmUserRepository;

  const row: UserOrmEntity = {
    id: 'user-1',
    googleId: 'google-123',
    email: 'ada@example.com',
    fullName: 'Ada Lovelace',
    avatarUrl: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<UserOrmEntity>>;
    userRepository = new TypeOrmUserRepository(repository);
  });

  it('mapea la fila a la entidad de dominio cuando encuentra al usuario por id', async () => {
    repository.findOne.mockResolvedValue(row);

    const result = await userRepository.findById('user-1');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
    expect(result?.fullName).toBe('Ada Lovelace');
  });

  it('devuelve null cuando no encuentra al usuario por id', async () => {
    repository.findOne.mockResolvedValue(null);

    const result = await userRepository.findById('unknown');

    expect(result).toBeNull();
  });

  it('mapea la fila a la entidad de dominio cuando el usuario existe', async () => {
    repository.findOne.mockResolvedValue(row);

    const result = await userRepository.findByGoogleId('google-123');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { googleId: 'google-123' },
    });
    expect(result?.id).toBe('user-1');
    expect(result?.email).toBe('ada@example.com');
  });

  it('devuelve null cuando no encuentra al usuario', async () => {
    repository.findOne.mockResolvedValue(null);

    const result = await userRepository.findByGoogleId('unknown');

    expect(result).toBeNull();
  });

  it('crea y guarda un usuario nuevo, devolviendo la entidad de dominio mapeada', async () => {
    repository.create.mockReturnValue(row);
    repository.save.mockResolvedValue(row);

    const result = await userRepository.create({
      googleId: 'google-123',
      email: 'ada@example.com',
      fullName: 'Ada Lovelace',
      avatarUrl: null,
    });

    /* eslint-disable @typescript-eslint/unbound-method -- jest.fn() no usa `this` */
    expect(repository.create).toHaveBeenCalledWith({
      googleId: 'google-123',
      email: 'ada@example.com',
      fullName: 'Ada Lovelace',
      avatarUrl: null,
    });
    expect(repository.save).toHaveBeenCalledWith(row);
    /* eslint-enable @typescript-eslint/unbound-method */
    expect(result.id).toBe('user-1');
  });
});
