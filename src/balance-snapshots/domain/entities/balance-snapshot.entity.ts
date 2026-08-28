import { Money } from '../../../shared/domain/value-objects/money.vo';

/**
 * Entidad de dominio: una "foto" del total del usuario en un momento dado
 * (ver CreateBalanceSnapshotUseCase, que la calcula) — un solo registro con
 * los tres montos juntos (total, largo+mediano plazo, corto plazo), todos en
 * la misma moneda, para que un solo click en "Guardar total actual" guarde
 * un solo punto en el histórico en vez de tres filas sueltas. Inmutable a
 * propósito: no hay caso de uso de edición, solo crear/listar/borrar —
 * editar un dato histórico falsearía el registro.
 */
export class BalanceSnapshot {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly totalAmount: Money,
    public readonly longMediumTermAmount: Money,
    public readonly shortTermAmount: Money,
    public readonly createdAt: Date,
  ) {}
}
