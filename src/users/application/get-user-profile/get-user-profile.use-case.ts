import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { USER_REPOSITORY } from '../../domain/ports/user-repository.port';
import type { UserRepositoryPort } from '../../domain/ports/user-repository.port';

/**
 * Caso de uso: obtiene el perfil completo de un usuario ya autenticado
 * (nombre, avatar, fecha de alta), a diferencia del payload del JWT que solo
 * trae id/email. Devuelve null si el usuario del token ya no existe (caso
 * borde: borrado después de emitido el token).
 */
@Injectable()
export class GetUserProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  execute(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }
}
