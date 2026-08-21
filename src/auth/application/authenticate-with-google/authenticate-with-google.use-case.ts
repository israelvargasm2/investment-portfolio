import { Inject, Injectable } from '@nestjs/common';
import { FindOrCreateUserByGoogleProfileUseCase } from '../../../users/application/find-or-create-user-by-google-profile/find-or-create-user-by-google-profile.use-case';
import { GOOGLE_TOKEN_VERIFIER } from '../../domain/ports/google-token-verifier.port';
import type { GoogleTokenVerifierPort } from '../../domain/ports/google-token-verifier.port';
import { TOKEN_ISSUER } from '../../domain/ports/token-issuer.port';
import type { TokenIssuerPort } from '../../domain/ports/token-issuer.port';
import { AuthenticateWithGoogleResult } from './authenticate-with-google.result';

/**
 * Caso de uso: valida el ID token de Google, resuelve (o crea) el usuario local
 * y emite el token de acceso propio. Es el único punto de entrada del login.
 */
@Injectable()
export class AuthenticateWithGoogleUseCase {
  constructor(
    @Inject(GOOGLE_TOKEN_VERIFIER)
    private readonly googleTokenVerifier: GoogleTokenVerifierPort,
    @Inject(TOKEN_ISSUER)
    private readonly tokenIssuer: TokenIssuerPort,
    private readonly findOrCreateUserByGoogleProfile: FindOrCreateUserByGoogleProfileUseCase,
  ) {}

  async execute(googleIdToken: string): Promise<AuthenticateWithGoogleResult> {
    const googleProfile = await this.googleTokenVerifier.verify(googleIdToken);
    const user =
      await this.findOrCreateUserByGoogleProfile.execute(googleProfile);
    const accessToken = await this.tokenIssuer.issueAccessToken({
      sub: user.id,
      email: user.email,
    });

    return { accessToken, user };
  }
}
