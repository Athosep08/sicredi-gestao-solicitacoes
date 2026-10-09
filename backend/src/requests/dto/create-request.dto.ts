import { IsEnum, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { Priority } from '../../common/enums';

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'O título é obrigatório.' })
  @MaxLength(255, { message: 'O título deve ter no máximo 255 caracteres.' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'A descrição é obrigatória.' })
  description: string;

  @IsUUID('4', { message: 'Área inválida.' })
  areaId: string;

  @IsEnum(Priority, { message: 'Prioridade deve ser low, medium ou high.' })
  priority: Priority;
}
