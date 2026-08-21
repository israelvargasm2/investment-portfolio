import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../http/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let reflector: jest.Mocked<Reflector>;
  let guard: JwtAuthGuard;

  const handlerRef = function handler() {};
  const classRef = class TestController {};
  const context = {
    getHandler: () => handlerRef,
    getClass: () => classRef,
  } as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new JwtAuthGuard(reflector);
  });

  it('deja pasar sin exigir JWT cuando el handler/controller está marcado @Public()', () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() no usa `this`
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      handlerRef,
      classRef,
    ]);
  });

  it('delega en la verificación JWT de Passport cuando no está marcado @Public()', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const passportCanActivate = jest
      .spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype) as {
          canActivate: unknown;
        },
        'canActivate',
      )
      .mockReturnValue(true);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(passportCanActivate).toHaveBeenCalledWith(context);
    passportCanActivate.mockRestore();
  });
});
