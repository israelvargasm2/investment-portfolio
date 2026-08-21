/**
 * Value object inmutable que representa un monto monetario con su moneda asociada.
 * Vive en el "shared kernel" (src/shared/domain) porque varios contextos
 * (market-data, purchases) necesitan exactamente la misma validación, a
 * diferencia de tipos como AssetType que cada contexto define por su cuenta.
 */
export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string,
  ) {}

  static of(amount: number, currency: string): Money {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error(`Invalid money amount: ${amount}`);
    }

    const normalizedCurrency = currency.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      throw new Error(`Invalid currency code: ${currency}`);
    }

    return new Money(amount, normalizedCurrency);
  }
}
