import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  // Hash descartável: com e-mail inexistente o argon2 roda do mesmo jeito, e o tempo de resposta
  // não revela quais e-mails estão cadastrados.
  private readonly dummyHash = argon2.hash('senha-descartavel-para-igualar-o-tempo');

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    // Mesma mensagem para e-mail inexistente e senha errada (não revela qual dos dois falhou).
    const ok = await argon2.verify(user?.passwordHash ?? (await this.dummyHash), password);
    if (!user || !ok) throw new UnauthorizedException('E-mail ou senha inválidos.');

    const payload = { sub: user.id, email: user.email, name: user.name, role: user.role };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }
}
