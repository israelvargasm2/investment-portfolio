import { Money } from '../../../shared/domain/value-objects/money.vo';
import { BalanceSnapshotScope } from '../balance-snapshot-scope.enum';

/**
 * Entidad de dominio: una "foto" del total de un subconjunto de cuentas del
 * usuario (`scope` — todas, largo+mediano plazo, o corto plazo) en un
 * momento dado (ver CreateBalanceSnapshotUseCase, que la calcula) — permite
 * armar un histórico de cómo evoluciona ese total en el tiempo. Inmutable a
 * propósito: no hay caso de uso de edición, solo crear/listar/borrar —
 * editar un dato histórico falsearía el registro.
 */
export class BalanceSnapshot {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly total: Money,
    public readonly scope: BalanceSnapshotScope,
    public readonly createdAt: Date,
  ) {}
}
