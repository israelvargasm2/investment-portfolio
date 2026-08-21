/**
 * Forma (parcial, solo los campos usados) de cada entrada de la respuesta del
 * endpoint /stock/symbol de Finnhub. Solo se documentan los campos que
 * consume este adaptador.
 */
export interface FinnhubSymbol {
  symbol: string;
  description: string;
  type: string; // "Common Stock", "ETP", "ADR", "Preferred Stock", "Warrant", etc.
}
