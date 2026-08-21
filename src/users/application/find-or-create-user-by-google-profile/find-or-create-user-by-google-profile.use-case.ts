import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { USER_REPOSITORY } from '../../domain/ports/user-repository.port';
import type { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { GoogleUserProfile } from './google-user-profile';

/**
 * Caso de uso: busca al usuario por su id de Google y, si no existe, lo crea.
 * Es el único punto de entrada para "login/registro" con Google.
 */
@Injectable()
export class FindOrCreateUserByGoogleProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(profile: GoogleUserProfile): Promise<User> {
    const existingUser = await this.userRepository.findByGoogleId(
      profile.googleId,
    );
    if (existingUser) {
      return existingUser;
    }

    return this.userRepository.create({
      googleId: profile.googleId,
      email: profile.email,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
    });
  }
}
