import { User } from '../../../users/domain/entities/user.entity';
import { FindOrCreateUserByGoogleProfileUseCase } from '../../../users/application/find-or-create-user-by-google-profile/find-or-create-user-by-google-profile.use-case';
import { GoogleTokenVerifierPort } from '../../domain/ports/google-token-verifier.port';
import { TokenIssuerPort } from '../../domain/ports/token-issuer.port';
import { AuthenticateWithGoogleUseCase } from './authenticate-with-google.use-case';

describe('AuthenticateWithGoogleUseCase', () => {
  let googleTokenVerifier: jest.Mocked<GoogleTokenVerifierPort>;
  let tokenIssuer: jest.Mocked<TokenIssuerPort>;
  let findOrCreateUserByGoogleProfile: jest.Mocked<FindOrCreateUserByGoogleProfileUseCase>;
  let useCase: AuthenticateWithGoogleUseCase;

  const user = new User(
    'user-1',
    'google-123',
    'ada@example.com',
    'Ada Lovelace',
    null,
    new Date('2026-01-01T00:00:00.000Z'),
  );

  beforeEach(() => {
    googleTokenVerifier = { verify: jest.fn() };
    tokenIssuer = { issueAccessToken: jest.fn() };
    findOrCreateUserByGoogleProfile = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<FindOrCreateUserByGoogleProfileUseCase>;
    useCase = new AuthenticateWithGoogleUseCase(
      googleTokenVerifier,
      tokenIssuer,
      findOrCreateUserByGoogleProfile,
    );
  });

  it('verifica el token, resuelve el usuario y emite un access token con su id y email', async () => {
    googleTokenVerifier.verify.mockResolvedValue({
      googleId: 'google-123',
      email: 'ada@example.com',
      fullName: 'Ada Lovelace',
      avatarUrl: null,
    });
    findOrCreateUserByGoogleProfile.execute.mockResolvedValue(user);
    tokenIssuer.issueAccessToken.mockResolvedValue('signed.jwt.token');

    const result = await useCase.execute('raw-google-id-token');

    /* eslint-disable @typescript-eslint/unbound-method -- jest.fn() no usa `this` */
    expect(googleTokenVerifier.verify).toHaveBeenCalledWith(
      'raw-google-id-token',
    );
    expect(findOrCreateUserByGoogleProfile.execute).toHaveBeenCalledWith({
      googleId: 'google-123',
      email: 'ada@example.com',
      fullName: 'Ada Lovelace',
      avatarUrl: null,
    });
    expect(tokenIssuer.issueAccessToken).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'ada@example.com',
    });
    /* eslint-enable @typescript-eslint/unbound-method */
    expect(result).toEqual({ accessToken: 'signed.jwt.token', user });
  });

  it('propaga el error si el token de Google no es válido', async () => {
    googleTokenVerifier.verify.mockRejectedValue(
      new Error('Invalid Google token'),
    );

    await expect(useCase.execute('bad-token')).rejects.toThrow(
      'Invalid Google token',
    );
    /* eslint-disable @typescript-eslint/unbound-method -- jest.fn() no usa `this` */
    expect(findOrCreateUserByGoogleProfile.execute).not.toHaveBeenCalled();
    expect(tokenIssuer.issueAccessToken).not.toHaveBeenCalled();
    /* eslint-enable @typescript-eslint/unbound-method */
  });
});
