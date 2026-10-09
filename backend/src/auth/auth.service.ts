import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    // Mesma mensagem para e-mail inexistente e senha errada (não revela qual dos dois falhou).
    const ok = user ? await argon2.verify(user.passwordHash, password) : false;
    if (!user || !ok) throw new UnauthorizedException('E-mail ou senha inválidos.');

    const payload = { sub: user.id, email: user.email, name: user.name, role: user.role };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }
}
