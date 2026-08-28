/**
 * Qué subconjunto de cuentas resume una foto del histórico: todas, solo las
 * de largo+mediano plazo juntas, o solo las de corto plazo (liquidez) — ver
 * `AccountTerm` en el módulo de cuentas. Al presionar "Guardar total actual"
 * el frontend pide las tres en una sola tanda (ver CreateBalanceSnapshotUseCase,
 * que filtra las cuentas por este scope antes de sumar).
 */
export enum BalanceSnapshotScope {
  ALL = 'all',
  LONG_MEDIUM = 'long_medium',
  SHORT = 'short',
}
