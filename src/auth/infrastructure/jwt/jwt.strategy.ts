import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthTokenPayload } from '../../domain/ports/token-issuer.port';
import { AuthenticatedUser } from './authenticated-user';

/**
 * Estrategia Passport que valida el JWT del header Authorization: Bearer <token>
 * y expone el usuario autenticado en `request.user` para los controladores.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: AuthTokenPayload): AuthenticatedUser {
    return { id: payload.sub, email: payload.email };
  }
}
