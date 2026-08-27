import { Account } from '../../../domain/entities/account.entity';
import { AccountTerm } from '../../../domain/account-term.enum';
import { InstitutionType } from '../../../domain/institution-type.enum';
import { RateTier } from '../../../domain/rate-tier';

export class AccountResponseDto {
  id: string;
  institutionName: string;
  institutionType: InstitutionType;
  balanceAmount: number;
  currency: string;
  rateTiers: RateTier[];
  estimatedAnnualYield: number;
  // Rendimiento total / balance, como un solo porcentaje "promedio" — útil
  // para mostrar una tabla sin tener que renderizar los tramos completos.
  effectiveAnnualRate: number;
  term: AccountTerm;
  createdAt: string;

  static fromDomain(account: Account): AccountResponseDto {
    const dto = new AccountResponseDto();
    dto.id = account.id;
    dto.institutionName = account.institutionName;
    dto.institutionType = account.institutionType;
    dto.balanceAmount = account.balance.amount;
    dto.currency = account.balance.currency;
    dto.rateTiers = account.rateTiers;
    dto.estimatedAnnualYield = account.estimatedAnnualYield;
    dto.effectiveAnnualRate = account.effectiveAnnualRate;
    dto.term = account.term;
    dto.createdAt = account.createdAt.toISOString();
    return dto;
  }
}
