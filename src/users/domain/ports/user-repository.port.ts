import { User } from '../entities/user.entity';

export interface NewUserData {
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

/**
 * Puerto de salida: persistencia de usuarios. Cualquier motor de base de datos
 * se conecta implementando esta interfaz, sin que el dominio ni la aplicación
 * sepan qué motor hay detrás.
 */
export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  create(newUser: NewUserData): Promise<User>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
