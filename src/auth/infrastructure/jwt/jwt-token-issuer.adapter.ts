import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AuthTokenPayload,
  TokenIssuerPort,
} from '../../domain/ports/token-issuer.port';

/**
 * Adaptador de salida que emite JWT usando @nestjs/jwt. El dominio y la aplicación
 * solo conocen TokenIssuerPort; si mañana se cambia a otra librería o esquema
 * de tokens, solo se reemplaza este adaptador.
 */
@Injectable()
export class JwtTokenIssuerAdapter implements TokenIssuerPort {
  constructor(private readonly jwtService: JwtService) {}

  async issueAccessToken(payload: AuthTokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }
}
