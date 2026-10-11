import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

// O frontend chama a API a partir de um único servidor, então contar só por IP bloquearia todos os
// usuários juntos. No login a contagem é por IP + e-mail: errar a senha de uma conta não trava as outras.
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    if (req.path === '/auth/login') {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      return `${req.ip}|${email}`;
    }
    return req.ip;
  }
}
