import { Money } from '../../../shared/domain/value-objects/money.vo';

/**
 * Entidad de dominio: una "foto" del total de todas las cuentas del usuario
 * en un momento dado (ver CreateBalanceSnapshotUseCase, que la calcula) —
 * permite armar un histórico de cómo evoluciona ese total en el tiempo.
 * Inmutable a propósito: no hay caso de uso de edición, solo crear/listar/
 * borrar — editar un dato histórico falsearía el registro.
 */
export class BalanceSnapshot {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly total: Money,
    public readonly createdAt: Date,
  ) {}
}
