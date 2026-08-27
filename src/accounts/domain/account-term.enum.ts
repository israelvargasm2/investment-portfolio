/**
 * Horizonte con el que el usuario clasifica una cuenta: corto plazo
 * (liquidez, para necesidades cercanas), mediano o largo plazo. Puramente
 * informativo — a diferencia de `rateTiers`, no afecta ningún cálculo (ver
 * `rate-tier.ts`), solo cómo se agrupa/muestra en la UI.
 */
export enum AccountTerm {
  SHORT = 'short',
  MEDIUM = 'medium',
  LONG = 'long',
}
