import {
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { GetUserProfileUseCase } from '../../../users/application/get-user-profile/get-user-profile.use-case';
import { AuthenticateWithGoogleUseCase } from '../../application/authenticate-with-google/authenticate-with-google.use-case';
import { InvalidGoogleTokenError } from '../../domain/errors/invalid-google-token.error';
import type { AuthenticatedUser } from '../jwt/authenticated-user';
import { CurrentUser } from './current-user.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { Public } from './public.decorator';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';

// Límite propio, más estricto que el global (ver app.module.ts): cada intento
// de login dispara una llamada a Google (verifyIdToken) y, si es válido, una
// lectura/escritura en la base — un endpoint público, así que sin este límite
// cualquiera puede scriptear reintentos y hacer gastar esa cuota/costo.
const LOGIN_THROTTLE_TTL_MS = 60_000;
const LOGIN_THROTTLE_LIMIT = 10;

/**
 * Adaptador de entrada HTTP para autenticación (Google) y verificación de sesión (JWT).
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authenticateWithGoogle: AuthenticateWithGoogleUseCase,
    private readonly getUserProfile: GetUserProfileUseCase,
  ) {}

  @Public()
  @Throttle({
    default: { limit: LOGIN_THROTTLE_LIMIT, ttl: LOGIN_THROTTLE_TTL_MS },
  })
  @Post('google')
  async loginWithGoogle(@Body() dto: GoogleLoginDto): Promise<AuthResponseDto> {
    try {
      const result = await this.authenticateWithGoogle.execute(dto.idToken);
      return AuthResponseDto.fromResult(result);
    } catch (error) {
      if (error instanceof InvalidGoogleTokenError) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }

  @Get('me')
  async getCurrentUser(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
  ): Promise<UserProfileResponseDto> {
    const user = await this.getUserProfile.execute(authenticatedUser.id);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return UserProfileResponseDto.fromDomain(user);
  }
}
