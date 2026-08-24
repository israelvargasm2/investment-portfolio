/**
 * El total no se pudo calcular (ej. falló la conversión de moneda de alguna
 * cuenta contra Frankfurter). A propósito no se guarda un total parcial ni
 * se ignora la cuenta problemática: mejor no guardar un dato histórico que
 * guardar uno incompleto sin que el usuario lo sepa.
 */
export class BalanceSnapshotCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BalanceSnapshotCalculationError';
  }
}
