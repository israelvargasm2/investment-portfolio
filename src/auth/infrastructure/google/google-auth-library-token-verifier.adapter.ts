import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { InvalidGoogleTokenError } from '../../domain/errors/invalid-google-token.error';
import {
  GoogleTokenVerifierPort,
  VerifiedGoogleProfile,
} from '../../domain/ports/google-token-verifier.port';

/**
 * Adaptador de salida que verifica ID tokens de Google usando google-auth-library.
 * Valida firma, emisor, expiración y que el "audience" coincida con nuestro client id.
 */
@Injectable()
export class GoogleAuthLibraryTokenVerifierAdapter implements GoogleTokenVerifierPort {
  private readonly client: OAuth2Client;
  private readonly clientId: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    this.client = new OAuth2Client(this.clientId);
  }

  async verify(idToken: string): Promise<VerifiedGoogleProfile> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email) {
        throw new Error('Google token payload is missing required fields');
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        fullName: payload.name ?? payload.email,
        avatarUrl: payload.picture ?? null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new InvalidGoogleTokenError(message);
    }
  }
}
