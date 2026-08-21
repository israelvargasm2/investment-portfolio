import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthenticateWithGoogleUseCase } from './application/authenticate-with-google/authenticate-with-google.use-case';
import { GOOGLE_TOKEN_VERIFIER } from './domain/ports/google-token-verifier.port';
import { TOKEN_ISSUER } from './domain/ports/token-issuer.port';
import { GoogleAuthLibraryTokenVerifierAdapter } from './infrastructure/google/google-auth-library-token-verifier.adapter';
import { AuthController } from './infrastructure/http/auth.controller';
import { JwtAuthGuard } from './infrastructure/jwt/jwt-auth.guard';
import { JwtStrategy } from './infrastructure/jwt/jwt.strategy';
import { JwtTokenIssuerAdapter } from './infrastructure/jwt/jwt-token-issuer.adapter';

const DEFAULT_ACCESS_TOKEN_EXPIRATION = '1h';

/**
 * Módulo del contexto "auth": login con Google (verificación de ID token) y
 * autorización vía JWT propio. Depende de UsersModule para encontrar/crear
 * el usuario local, sin conocer cómo se persiste.
 *
 * JwtAuthGuard se registra acá como APP_GUARD (guard global): protege todas
 * las rutas de la app por defecto, no solo las de este módulo — por eso
 * WatchlistController/PurchasesController ya no necesitan `@UseGuards`
 * propio ni importar AuthModule para eso. Cualquier ruta que deba quedar
 * pública (login, catálogos de solo lectura) se marca explícitamente con
 * `@Public()` en vez de depender de que cada controller nuevo se acuerde de
 * agregar el guard — "seguro por defecto" en vez de "público por defecto".
 */
@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>(
            'JWT_EXPIRES_IN',
            DEFAULT_ACCESS_TOKEN_EXPIRATION,
          ) as NonNullable<JwtModuleOptions['signOptions']>['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthenticateWithGoogleUseCase,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    {
      provide: GOOGLE_TOKEN_VERIFIER,
      useClass: GoogleAuthLibraryTokenVerifierAdapter,
    },
    { provide: TOKEN_ISSUER, useClass: JwtTokenIssuerAdapter },
  ],
})
export class AuthModule {}
