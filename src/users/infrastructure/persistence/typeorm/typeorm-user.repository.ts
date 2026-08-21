import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../domain/entities/user.entity';
import {
  NewUserData,
  UserRepositoryPort,
} from '../../../domain/ports/user-repository.port';
import { UserOrmEntity } from './user.orm-entity';

/**
 * Adaptador de salida: implementa UserRepositoryPort usando TypeORM sobre Postgres.
 */
@Injectable()
export class TypeOrmUserRepository implements UserRepositoryPort {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.repository.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const row = await this.repository.findOne({ where: { googleId } });
    return row ? this.toDomain(row) : null;
  }

  async create(newUser: NewUserData): Promise<User> {
    const row = this.repository.create(newUser);
    const savedRow = await this.repository.save(row);
    return this.toDomain(savedRow);
  }

  private toDomain(row: UserOrmEntity): User {
    return new User(
      row.id,
      row.googleId,
      row.email,
      row.fullName,
      row.avatarUrl,
      row.createdAt,
    );
  }
}
