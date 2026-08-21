import { UnauthorizedException } from '@nestjs/common';
import { GetUserProfileUseCase } from '../../../users/application/get-user-profile/get-user-profile.use-case';
import { User } from '../../../users/domain/entities/user.entity';
import { AuthenticateWithGoogleUseCase } from '../../application/authenticate-with-google/authenticate-with-google.use-case';
import { InvalidGoogleTokenError } from '../../domain/errors/invalid-google-token.error';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let authenticateWithGoogle: jest.Mocked<AuthenticateWithGoogleUseCase>;
  let getUserProfile: jest.Mocked<GetUserProfileUseCase>;
  let controller: AuthController;

  beforeEach(() => {
    authenticateWithGoogle = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AuthenticateWithGoogleUseCase>;
    getUserProfile = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetUserProfileUseCase>;
    controller = new AuthController(authenticateWithGoogle, getUserProfile);
  });

  it('devuelve el access token y el usuario mapeados al DTO de respuesta', async () => {
    const user = new User(
      'user-1',
      'google-123',
      'ada@example.com',
      'Ada Lovelace',
      null,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    authenticateWithGoogle.execute.mockResolvedValue({
      accessToken: 'signed.jwt.token',
      user,
    });

    const response = await controller.loginWithGoogle({
      idToken: 'raw-google-id-token',
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(authenticateWithGoogle.execute).toHaveBeenCalledWith(
      'raw-google-id-token',
    );
    expect(response).toEqual({
      accessToken: 'signed.jwt.token',
      user: {
        id: 'user-1',
        email: 'ada@example.com',
        fullName: 'Ada Lovelace',
        avatarUrl: null,
      },
    });
  });

  it('traduce InvalidGoogleTokenError a UnauthorizedException (401)', async () => {
    authenticateWithGoogle.execute.mockRejectedValue(
      new InvalidGoogleTokenError('Token used too late'),
    );

    await expect(
      controller.loginWithGoogle({ idToken: 'expired' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('devuelve el perfil completo del usuario autenticado en /auth/me', async () => {
    const currentUser = { id: 'user-1', email: 'ada@example.com' };
    const user = new User(
      'user-1',
      'google-123',
      'ada@example.com',
      'Ada Lovelace',
      'https://example.com/avatar.png',
      new Date('2026-01-01T00:00:00.000Z'),
    );
    getUserProfile.execute.mockResolvedValue(user);

    const response = await controller.getCurrentUser(currentUser);

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(getUserProfile.execute).toHaveBeenCalledWith('user-1');
    expect(response).toEqual({
      id: 'user-1',
      email: 'ada@example.com',
      fullName: 'Ada Lovelace',
      avatarUrl: 'https://example.com/avatar.png',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('traduce un usuario inexistente a UnauthorizedException (401) en /auth/me', async () => {
    const currentUser = { id: 'user-1', email: 'ada@example.com' };
    getUserProfile.execute.mockResolvedValue(null);

    await expect(controller.getCurrentUser(currentUser)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
