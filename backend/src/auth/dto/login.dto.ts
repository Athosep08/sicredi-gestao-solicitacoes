import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(254, { message: 'Informe um e-mail válido.' })
  email: string;

  // O teto evita gastar CPU de hash com senhas gigantes.
  @IsString()
  @MinLength(1, { message: 'Informe a senha.' })
  @MaxLength(128, { message: 'A senha deve ter no máximo 128 caracteres.' })
  password: string;
}
