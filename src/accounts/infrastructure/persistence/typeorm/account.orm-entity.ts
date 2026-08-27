import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AccountTerm } from '../../../domain/account-term.enum';
import { InstitutionType } from '../../../domain/institution-type.enum';
import { RateTier } from '../../../domain/rate-tier';

/**
 * Modelo de fila de TypeORM para "accounts". Sin relación @ManyToOne a
 * UserOrmEntity a propósito, igual que en purchases/watchlist: la FK vive en
 * la migration.
 *
 * `rateTiers` es jsonb (no columnas planas): es una lista de largo variable
 * que siempre se lee/escribe completa junto con la cuenta (nunca se
 * consulta un tramo suelto), así que no amerita una tabla aparte — un
 * enfoque relacional puro acá sería complejidad sin beneficio real.
 */
@Entity({ name: 'accounts' })
export class AccountOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar' })
  institutionName: string;

  @Column({ type: 'varchar' })
  institutionType: InstitutionType;

  @Column({ type: 'double precision' })
  balanceAmount: number;

  @Column({ type: 'varchar' })
  balanceCurrency: string;

  @Column({ type: 'jsonb' })
  rateTiers: RateTier[];

  @Column({ type: 'varchar' })
  term: AccountTerm;

  @CreateDateColumn()
  createdAt: Date;
}
