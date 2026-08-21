/**
 * Forma (parcial, solo los campos usados) de la respuesta del endpoint no
 * oficial `v8/finance/chart` de Yahoo Finance.
 */
export interface YahooFinanceChartResponse {
  chart: {
    result: Array<{
      meta: {
        currency: string;
        regularMarketPrice: number;
      };
      // Serie diaria de cierres (pedida con range=5d&interval=1d): el último
      // valor no nulo es más confiable que meta.regularMarketPrice para
      // instrumentos de baja liquidez, ver el comentario en el adaptador.
      timestamp?: number[];
      indicators?: {
        quote: Array<{ close: Array<number | null> }>;
      };
    }> | null;
    error: { code: string; description: string } | null;
  };
}
