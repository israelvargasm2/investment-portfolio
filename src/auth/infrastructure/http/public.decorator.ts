import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca un handler o controller como público: JwtAuthGuard (registrado
 * globalmente como APP_GUARD) lo deja pasar sin exigir Authorization. Usar
 * solo en endpoints que deliberadamente no requieren sesión (login, catálogos
 * de solo lectura) — cualquier ruta nueva sin este decorator queda protegida
 * por defecto.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
