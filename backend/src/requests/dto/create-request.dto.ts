import { IsEnum, IsUUID } from 'class-validator';
import { Priority } from '../../common/enums';
import { RequiredText } from '../../common/text.decorators';

export class CreateRequestDto {
  @RequiredText('O título', 255)
  title: string;

  @RequiredText('A descrição', 10000)
  description: string;

  @IsUUID('4', { message: 'Área inválida.' })
  areaId: string;

  @IsEnum(Priority, { message: 'Prioridade deve ser low, medium ou high.' })
  priority: Priority;
}
