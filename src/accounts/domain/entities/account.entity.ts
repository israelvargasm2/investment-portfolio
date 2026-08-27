import { Money } from '../../../shared/domain/value-objects/money.vo';
import { AccountTerm } from '../account-term.enum';
import { InstitutionType } from '../institution-type.enum';
import {
  RateTier,
  calculateAnnualYield,
  calculateEffectiveAnnualRate,
} from '../rate-tier';

/**
 * Entidad de dominio: una cuenta (banco, SOFIPO, etc.) donde el usuario tiene
 * dinero guardado, junto con los tramos de tasa anual que le paga esa
 * institución (algunas dan una tasa hasta cierto monto y otra distinta al
 * excedente — ver rate-tier.ts para el cálculo progresivo).
 *
 * A diferencia de Purchase/WatchlistItem, no depende de ningún precio de
 * mercado (no hay "activo" que cotice): todo lo que necesita para calcular
 * `estimatedAnnualYield`/`effectiveAnnualRate` son sus propios campos, así
 * que esos cálculos viven acá como getters en vez de en un caso de uso (no
 * hay nada asíncrono ni externo de por medio, a diferencia de
 * GetPurchasesPerformanceUseCase).
 */
export class Account {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly institutionName: string,
    public readonly institutionType: InstitutionType,
    public readonly balance: Money,
    public readonly rateTiers: RateTier[],
    public readonly term: AccountTerm,
    public readonly createdAt: Date,
  ) {}

  get estimatedAnnualYield(): number {
    return calculateAnnualYield(this.balance.amount, this.rateTiers);
  }

  get effectiveAnnualRate(): number {
    return calculateEffectiveAnnualRate(this.balance.amount, this.rateTiers);
  }
}
