import { InvalidRateTiersError } from './errors/invalid-rate-tiers.error';
import {
  calculateAnnualYield,
  calculateEffectiveAnnualRate,
  validateRateTiers,
} from './rate-tier';

describe('calculateAnnualYield', () => {
  it('aplica una sola tasa plana a todo el balance (cuenta sin tramos)', () => {
    const yield_ = calculateAnnualYield(10000, [
      { upToAmount: null, annualRate: 8.5 },
    ]);

    expect(yield_).toBeCloseTo(850);
  });

  it('calcula de forma progresiva: cada tramo solo sobre su propia franja', () => {
    // Primeros $25,000 al 15%, el resto al 6% — con $30,000 de balance:
    // 25000*0.15 + 5000*0.06 = 3750 + 300 = 4050 (NO 30000*0.06 = 1800).
    const tiers = [
      { upToAmount: 25000, annualRate: 15 },
      { upToAmount: null, annualRate: 6 },
    ];

    expect(calculateAnnualYield(30000, tiers)).toBeCloseTo(4050);
  });

  it('con balance por debajo del primer tope, solo aplica la tasa del primer tramo', () => {
    const tiers = [
      { upToAmount: 25000, annualRate: 15 },
      { upToAmount: null, annualRate: 6 },
    ];

    expect(calculateAnnualYield(10000, tiers)).toBeCloseTo(1500); // 10000 * 0.15
  });

  it('no paga interés sobre el excedente si el último tramo tiene un tope (no es ilimitado)', () => {
    const tiers = [{ upToAmount: 10000, annualRate: 10 }];

    expect(calculateAnnualYield(15000, tiers)).toBeCloseTo(1000); // solo los primeros 10000
  });

  it('soporta tres tramos', () => {
    const tiers = [
      { upToAmount: 10000, annualRate: 15 },
      { upToAmount: 50000, annualRate: 10 },
      { upToAmount: null, annualRate: 5 },
    ];
    // 10000*0.15 + 40000*0.10 + 20000*0.05 = 1500 + 4000 + 1000 = 6500
    expect(calculateAnnualYield(70000, tiers)).toBeCloseTo(6500);
  });
});

describe('calculateEffectiveAnnualRate', () => {
  it('devuelve el rendimiento dividido el balance, como porcentaje', () => {
    const tiers = [
      { upToAmount: 25000, annualRate: 15 },
      { upToAmount: null, annualRate: 6 },
    ];

    expect(calculateEffectiveAnnualRate(30000, tiers)).toBeCloseTo(13.5); // 4050 / 30000 * 100
  });

  it('devuelve 0 con balance 0 (evita dividir por cero)', () => {
    expect(
      calculateEffectiveAnnualRate(0, [{ upToAmount: null, annualRate: 10 }]),
    ).toBe(0);
  });
});

describe('validateRateTiers', () => {
  it('acepta un único tramo ilimitado', () => {
    expect(() =>
      validateRateTiers([{ upToAmount: null, annualRate: 8 }]),
    ).not.toThrow();
  });

  it('acepta varios tramos con topes crecientes y el último ilimitado', () => {
    expect(() =>
      validateRateTiers([
        { upToAmount: 25000, annualRate: 15 },
        { upToAmount: null, annualRate: 6 },
      ]),
    ).not.toThrow();
  });

  it('rechaza una lista vacía', () => {
    expect(() => validateRateTiers([])).toThrow(InvalidRateTiersError);
  });

  it('rechaza un tramo con annualRate negativo', () => {
    expect(() =>
      validateRateTiers([{ upToAmount: null, annualRate: -1 }]),
    ).toThrow(InvalidRateTiersError);
  });

  it('rechaza upToAmount: null en un tramo que no es el último', () => {
    expect(() =>
      validateRateTiers([
        { upToAmount: null, annualRate: 15 },
        { upToAmount: 25000, annualRate: 6 },
      ]),
    ).toThrow(InvalidRateTiersError);
  });

  it('rechaza topes que no son estrictamente crecientes', () => {
    expect(() =>
      validateRateTiers([
        { upToAmount: 25000, annualRate: 15 },
        { upToAmount: 25000, annualRate: 6 },
      ]),
    ).toThrow(InvalidRateTiersError);

    expect(() =>
      validateRateTiers([
        { upToAmount: 25000, annualRate: 15 },
        { upToAmount: 10000, annualRate: 6 },
      ]),
    ).toThrow(InvalidRateTiersError);
  });

  it('rechaza un upToAmount no positivo', () => {
    expect(() => validateRateTiers([{ upToAmount: 0, annualRate: 8 }])).toThrow(
      InvalidRateTiersError,
    );
  });
});
