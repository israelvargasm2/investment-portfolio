import { InvalidRateTiersError } from './errors/invalid-rate-tiers.error';

/**
 * Un tramo de tasa: "hasta $upToAmount (balance total de la cuenta, no solo
 * esta franja) se paga annualRate% anual". Solo el ÚLTIMO tramo puede tener
 * `upToAmount: null` ("sin tope" — cubre todo lo que exceda el tramo
 * anterior); si el último tramo SÍ tiene un tope, cualquier balance por
 * encima de ese tope simplemente no gana interés (algunas cuentas limitan
 * así, a propósito no se asume que siempre hay un tramo ilimitado).
 */
export interface RateTier {
  upToAmount: number | null;
  annualRate: number;
}

/**
 * Valida que los tramos formen una escalera coherente: al menos uno, montos
 * crecientes estrictos, y `upToAmount: null` solo permitido en el último
 * (en cualquier otra posición dejaría tramos posteriores inalcanzables).
 */
export function validateRateTiers(tiers: RateTier[]): void {
  if (tiers.length === 0) {
    throw new InvalidRateTiersError('At least one rate tier is required');
  }

  let previousCap = 0;
  tiers.forEach((tier, index) => {
    if (!Number.isFinite(tier.annualRate) || tier.annualRate < 0) {
      throw new InvalidRateTiersError(
        `Tier ${index}: annualRate must be a number >= 0`,
      );
    }

    const isLastTier = index === tiers.length - 1;
    if (tier.upToAmount === null) {
      if (!isLastTier) {
        throw new InvalidRateTiersError(
          `Tier ${index}: only the last tier may have an unlimited upToAmount (null)`,
        );
      }
      return;
    }

    if (!Number.isFinite(tier.upToAmount) || tier.upToAmount <= previousCap) {
      throw new InvalidRateTiersError(
        `Tier ${index}: upToAmount must be greater than the previous tier's upToAmount`,
      );
    }
    previousCap = tier.upToAmount;
  });
}

/**
 * Cálculo progresivo (mismo criterio que los tramos de un impuesto): cada
 * tramo se calcula solo sobre SU franja del balance, no sobre el balance
 * completo — un balance que cruza un tope no "salta" entero a la tasa
 * siguiente, solo el excedente paga la tasa del tramo de arriba. Es el
 * modelo que usan bancos/SOFIPOs reales (ej. "primeros $25,000 al 15%, el
 * resto al 6%"): con $30,000 de balance, gana 15% sobre $25,000 + 6% sobre
 * los $5,000 restantes, no 6% sobre los $30,000 completos.
 */
export function calculateAnnualYield(
  balanceAmount: number,
  tiers: RateTier[],
): number {
  let remaining = balanceAmount;
  let previousCap = 0;
  let totalYield = 0;

  for (const tier of tiers) {
    if (remaining <= 0) {
      break;
    }
    const cap = tier.upToAmount ?? Infinity;
    const tierWidth = cap - previousCap;
    const amountInTier = Math.min(remaining, tierWidth);
    totalYield += amountInTier * (tier.annualRate / 100);
    remaining -= amountInTier;
    previousCap = cap;
  }

  return totalYield;
}

/** Tasa efectiva/promedio (rendimiento total dividido el balance), para mostrar un solo número. */
export function calculateEffectiveAnnualRate(
  balanceAmount: number,
  tiers: RateTier[],
): number {
  if (balanceAmount === 0) {
    return 0;
  }
  return (calculateAnnualYield(balanceAmount, tiers) / balanceAmount) * 100;
}
