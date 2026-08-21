export interface AuthTokenPayload {
  sub: string;
  email: string;
}

/**
 * Puerto de salida: emite el token de acceso que el cliente usará en el header
 * Authorization. Hoy lo implementa un adaptador de JWT; podría cambiarse sin
 * tocar el caso de uso que lo invoca.
 */
export interface TokenIssuerPort {
  issueAccessToken(payload: AuthTokenPayload): Promise<string>;
}

export const TOKEN_ISSUER = Symbol('TOKEN_ISSUER');
