import { Money } from '../../../shared/domain/value-objects/money.vo';
import { Account } from '../entities/account.entity';
import { InstitutionType } from '../institution-type.enum';
import { RateTier } from '../rate-tier';

export interface NewAccountData {
  userId: string;
  institutionName: string;
  institutionType: InstitutionType;
  balance: Money;
  rateTiers: RateTier[];
}

export interface AccountDetailsData {
  institutionName: string;
  institutionType: InstitutionType;
  balance: Money;
  rateTiers: RateTier[];
}

/**
 * Puerto de salida: persistencia de cuentas. Cualquier motor de base de datos
 * se conecta implementando esta interfaz.
 */
export interface AccountRepositoryPort {
  findByUserId(userId: string): Promise<Account[]>;
  create(newAccount: NewAccountData): Promise<Account>;
  updateByIdAndUserId(
    id: string,
    userId: string,
    data: AccountDetailsData,
  ): Promise<Account | null>;
  deleteByIdAndUserId(id: string, userId: string): Promise<boolean>;
}

export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');
