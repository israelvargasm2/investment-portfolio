/**
 * Forma de la respuesta del endpoint /quote de Finnhub.
 * Solo se documentan los campos que consume este adaptador.
 */
export interface FinnhubQuoteResponse {
  c: number; // current price
}
