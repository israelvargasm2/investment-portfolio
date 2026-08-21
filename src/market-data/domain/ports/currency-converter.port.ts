/**
 * Puerto de salida: convierte un monto entre monedas usando tasas de cambio actuales.
 */
export interface CurrencyConverterPort {
  convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number>;
}

export const CURRENCY_CONVERTER = Symbol('CURRENCY_CONVERTER');
