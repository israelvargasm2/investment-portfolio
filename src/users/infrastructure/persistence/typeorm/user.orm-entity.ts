import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Modelo de fila de TypeORM para la tabla "users". No es la entidad de dominio:
 * se mapea a/desde `User` en el repositorio, para que TypeORM no se filtre al dominio.
 */
@Entity({ name: 'users' })
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  googleId: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  fullName: string;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
