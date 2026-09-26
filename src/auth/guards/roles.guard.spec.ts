import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '@prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('debe estar definido', () => {
    expect(guard).toBeDefined();
  });

  const createMockContext = (user: any): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('debe permitir acceso si no hay roles requeridos', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext(null);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe lanzar ForbiddenException si no hay usuario autenticado', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.ADMIN]);
    const context = createMockContext(null);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('debe permitir acceso si el usuario cuenta con el rol requerido', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.ADMIN, Role.SUPERVISOR]);
    const context = createMockContext({ role: Role.ADMIN });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe permitir acceso si el rol requerido es ASESOR y el usuario tiene AGENT', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['ASESOR']);
    const context = createMockContext({ role: Role.AGENT });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe lanzar ForbiddenException si el usuario no cuenta con el rol requerido', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.ADMIN]);
    const context = createMockContext({ role: Role.AGENT });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
