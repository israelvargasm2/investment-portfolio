import { Account } from '../../../domain/entities/account.entity';
import { AccountTerm } from '../../../domain/account-term.enum';
import { InstitutionType } from '../../../domain/institution-type.enum';
import { Money } from '../../../../shared/domain/value-objects/money.vo';
import { AccountsListResponseDto } from './accounts-list-response.dto';

describe('AccountsListResponseDto', () => {
  it('mapea cada cuenta y calcula los totales de rendimiento anual y mensual por separado', () => {
    const accountA = new Account(
      'account-1',
      'user-1',
      'BBVA',
      InstitutionType.BANK,
      Money.of(10000, 'MXN'),
      [{ upToAmount: null, annualRate: 8.5 }], // 850 anual
      AccountTerm.LONG,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    const accountB = new Account(
      'account-2',
      'user-1',
      'Klar',
      InstitutionType.SOFIPO,
      Money.of(30000, 'MXN'),
      [
        { upToAmount: 25000, annualRate: 15 },
        { upToAmount: null, annualRate: 6 },
      ], // 4050 anual
      AccountTerm.LONG,
      new Date('2026-01-01T00:00:00.000Z'),
    );

    const dto = AccountsListResponseDto.fromDomain([accountA, accountB]);

    expect(dto.accounts).toHaveLength(2);
    expect(dto.totalAnnualYield).toBeCloseTo(4900);
    expect(dto.totalMonthlyYield).toBeCloseTo(4900 / 12);
  });

  it('devuelve totales en cero cuando no hay cuentas', () => {
    const dto = AccountsListResponseDto.fromDomain([]);

    expect(dto.accounts).toEqual([]);
    expect(dto.totalAnnualYield).toBe(0);
    expect(dto.totalMonthlyYield).toBe(0);
  });
});
