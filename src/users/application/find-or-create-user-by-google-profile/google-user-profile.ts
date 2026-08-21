/**
 * Datos del perfil de Google ya verificado, usados para identificar o crear al usuario.
 */
export interface GoogleUserProfile {
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}
