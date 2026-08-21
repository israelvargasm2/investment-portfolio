/**
 * Error de dominio lanzado cuando un proveedor externo de datos de mercado
 * (Finnhub, CoinGecko, Yahoo Finance, Frankfurter) devuelve HTTP 429: se
 * superó el límite de peticiones. Se distingue de un error genérico para que
 * capas superiores puedan advertir al usuario en vez de asumir que el activo
 * no existe (ver GetAssetPricesUseCase).
 */
export class RateLimitExceededError extends Error {
  constructor(public readonly provider: string) {
    super(`Rate limit exceeded for ${provider}. Try again in a few minutes.`);
    this.name = 'RateLimitExceededError';
  }
}
