import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';

// Mantém o argon2 real, só conta as chamadas a verify.
jest.mock('argon2', () => {
  const actual = jest.requireActual('argon2');
  return { ...actual, verify: jest.fn(actual.verify) };
});

describe('AuthService.login', () => {
  const jwt = { signAsync: jest.fn().mockResolvedValue('token') };
  const build = (user: any) => new AuthService({ findByEmail: jest.fn().mockResolvedValue(user) } as any, jwt as any);

  beforeEach(() => (argon2.verify as jest.Mock).mockClear());

  it('com e-mail inexistente ainda roda o argon2, para o tempo de resposta não revelar quais e-mails existem', async () => {
    await expect(build(null).login('nao@existe.com', 'qualquer')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(argon2.verify).toHaveBeenCalledTimes(1);
  });

  it('e-mail inexistente e senha errada devolvem a mesma mensagem', async () => {
    const hash = await argon2.hash('certa');
    const missing = await build(null).login('a@a.com', 'x').catch((e) => e.message);
    const wrong = await build({ passwordHash: hash }).login('a@a.com', 'errada').catch((e) => e.message);
    expect(missing).toBe(wrong);
  });

  it('autentica com a senha correta', async () => {
    const hash = await argon2.hash('certa');
    const user = { id: '1', name: 'Ana', email: 'a@a.com', role: 'requester', passwordHash: hash };
    const res = await build(user).login('a@a.com', 'certa');
    expect(res.accessToken).toBe('token');
    expect(res.user).not.toHaveProperty('passwordHash');
  });
});
