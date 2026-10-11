import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

const trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

// O Postgres rejeita o caractere nulo em colunas de texto; sem esta checagem ele viraria erro 500.
const noNullChar = (label: string) => Matches(/^[^\u0000]*$/, { message: `${label} contém caracteres inválidos.` });

/** Texto obrigatório: o trim roda ANTES da validação, então "   " conta como vazio. */
export function RequiredText(label: string, max: number) {
  return applyDecorators(
    trim(),
    IsString({ message: `${label} deve ser um texto.` }),
    IsNotEmpty({ message: `${label} é obrigatório.` }),
    MaxLength(max, { message: `${label} deve ter no máximo ${max} caracteres.` }),
    noNullChar(label),
  );
}

/** Igual ao RequiredText, mas o campo pode ser omitido (PATCH). Enviar null continua inválido. */
export function OptionalText(label: string, max: number) {
  return applyDecorators(
    ValidateIf((_, v) => v !== undefined),
    RequiredText(label, max),
  );
}
