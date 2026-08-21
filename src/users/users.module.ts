import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FindOrCreateUserByGoogleProfileUseCase } from './application/find-or-create-user-by-google-profile/find-or-create-user-by-google-profile.use-case';
import { GetUserProfileUseCase } from './application/get-user-profile/get-user-profile.use-case';
import { USER_REPOSITORY } from './domain/ports/user-repository.port';
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm/typeorm-user.repository';
import { UserOrmEntity } from './infrastructure/persistence/typeorm/user.orm-entity';

/**
 * Módulo del contexto "users". Expone FindOrCreateUserByGoogleProfileUseCase
 * y GetUserProfileUseCase para que otros contextos (ej. auth) puedan
 * encontrar/crear usuarios y leer su perfil sin conocer TypeORM ni Postgres.
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  providers: [
    FindOrCreateUserByGoogleProfileUseCase,
    GetUserProfileUseCase,
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
  ],
  exports: [FindOrCreateUserByGoogleProfileUseCase, GetUserProfileUseCase],
})
export class UsersModule {}
