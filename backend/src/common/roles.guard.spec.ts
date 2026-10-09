import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from './enums';
import { RolesGuard } from './roles.guard';

function ctx(user: unknown): ExecutionContext {
  return {
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  it('libera rota sem restrição de papel', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(ctx({ role: UserRole.REQUESTER }))).toBe(true);
  });

  it('libera quando o papel do token está na lista', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.AGENT, UserRole.SUPERVISOR]);
    expect(guard.canActivate(ctx({ role: UserRole.AGENT }))).toBe(true);
  });

  it('bloqueia solicitante em rota de atendente/supervisor', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.AGENT, UserRole.SUPERVISOR]);
    expect(() => guard.canActivate(ctx({ role: UserRole.REQUESTER }))).toThrow(ForbiddenException);
  });

  it('bloqueia quando não há usuário na requisição', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.SUPERVISOR]);
    expect(() => guard.canActivate(ctx(undefined))).toThrow(ForbiddenException);
  });
});
