import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../jwt/authenticated-user';

interface RequestWithUser {
  user: AuthenticatedUser;
}

/**
 * Extrae el usuario autenticado (adjuntado por JwtStrategy) en un handler protegido por JwtAuthGuard.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
