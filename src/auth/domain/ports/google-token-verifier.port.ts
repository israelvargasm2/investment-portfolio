/**
 * Perfil ya verificado extraído del ID token de Google. Se define aquí (en el
 * contexto "auth") para no depender del tipo de entrada del contexto "users";
 * ambos tipos coinciden en forma, por lo que TypeScript los acepta de forma
 * estructural sin acoplar los contextos por import.
 */
export interface VerifiedGoogleProfile {
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

/**
 * Puerto de salida: verifica un ID token de Google y extrae el perfil del usuario.
 * La implementación decide cómo se valida (google-auth-library hoy, otra librería mañana).
 */
export interface GoogleTokenVerifierPort {
  verify(idToken: string): Promise<VerifiedGoogleProfile>;
}

export const GOOGLE_TOKEN_VERIFIER = Symbol('GOOGLE_TOKEN_VERIFIER');
