/**
 * Entidad de dominio: un usuario autenticado a través de un proveedor externo (Google).
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly googleId: string,
    public readonly email: string,
    public readonly fullName: string,
    public readonly avatarUrl: string | null,
    public readonly createdAt: Date,
  ) {}
}
