/**
 * Error de dominio: el ID token de Google no es válido (expirado, mal formado,
 * emisor incorrecto, o "audience" que no coincide con nuestro client id).
 */
export class InvalidGoogleTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidGoogleTokenError';
  }
}
