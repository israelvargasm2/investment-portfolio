/**
 * Forma del usuario autenticado que Passport adjunta a `request.user`
 * después de validar el JWT.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
}
