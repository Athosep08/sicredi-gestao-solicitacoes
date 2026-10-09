import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from './enums';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest().user;
});
