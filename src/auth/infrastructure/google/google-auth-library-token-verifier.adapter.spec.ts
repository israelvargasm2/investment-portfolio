import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { InvalidGoogleTokenError } from '../../domain/errors/invalid-google-token.error';
import { GoogleAuthLibraryTokenVerifierAdapter } from './google-auth-library-token-verifier.adapter';

describe('GoogleAuthLibraryTokenVerifierAdapter', () => {
  let configService: jest.Mocked<ConfigService>;
  let verifyIdTokenSpy: jest.SpyInstance;
  let adapter: GoogleAuthLibraryTokenVerifierAdapter;

  beforeEach(() => {
    configService = {
      getOrThrow: jest.fn().mockReturnValue('fake-client-id'),
    } as unknown as jest.Mocked<ConfigService>;
    adapter = new GoogleAuthLibraryTokenVerifierAdapter(configService);
    verifyIdTokenSpy = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
  });

  afterEach(() => {
    verifyIdTokenSpy.mockRestore();
  });

  it('devuelve el perfil verificado cuando el token es válido', async () => {
    verifyIdTokenSpy.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-123',
        email: 'ada@example.com',
        name: 'Ada Lovelace',
        picture: 'https://example.com/avatar.png',
      }),
    });

    const profile = await adapter.verify('raw-id-token');

    expect(profile).toEqual({
      googleId: 'google-123',
      email: 'ada@example.com',
      fullName: 'Ada Lovelace',
      avatarUrl: 'https://example.com/avatar.png',
    });
    expect(verifyIdTokenSpy).toHaveBeenCalledWith({
      idToken: 'raw-id-token',
      audience: 'fake-client-id',
    });
  });

  it('lanza InvalidGoogleTokenError cuando google-auth-library rechaza el token', async () => {
    verifyIdTokenSpy.mockRejectedValue(new Error('Token used too late'));

    await expect(adapter.verify('expired-token')).rejects.toThrow(
      InvalidGoogleTokenError,
    );
  });

  it('lanza InvalidGoogleTokenError cuando el payload no trae sub o email', async () => {
    verifyIdTokenSpy.mockResolvedValue({
      getPayload: () => ({ name: 'Ada Lovelace' }),
    });

    await expect(adapter.verify('token-without-sub')).rejects.toThrow(
      InvalidGoogleTokenError,
    );
  });
});
