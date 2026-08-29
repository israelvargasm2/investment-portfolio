import { Account } from '../../../domain/entities/account.entity';
import { AccountResponseDto } from './account-response.dto';

const MONTHS_PER_YEAR = 12;

/**
 * Respuesta de GET /accounts: la lista de cuentas más las sumas de
 * rendimiento anual y mensual del total de la tabla. Se reportan por
 * separado (no se suman entre sí) porque son unidades distintas — una es el
 * rendimiento anual y la otra su parte mensual. `totalMonthlyYield` es
 * `totalAnnualYield / 12` — igual que `estimatedMonthlyYield` en el
 * frontend (ver AccountsListComponent), dividir por una constante no es una
 * regla de negocio, así que no hace falta sumarlo aparte por cuenta.
 */
export class AccountsListResponseDto {
  accounts: AccountResponseDto[];
  totalAnnualYield: number;
  totalMonthlyYield: number;

  static fromDomain(accounts: Account[]): AccountsListResponseDto {
    const dto = new AccountsListResponseDto();
    dto.accounts = accounts.map((account) =>
      AccountResponseDto.fromDomain(account),
    );
    dto.totalAnnualYield = accounts.reduce(
      (sum, account) => sum + account.estimatedAnnualYield,
      0,
    );
    dto.totalMonthlyYield = dto.totalAnnualYield / MONTHS_PER_YEAR;
    return dto;
  }
}
