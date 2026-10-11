import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Priority } from '../../common/enums';
import { OptionalText } from '../../common/text.decorators';

// Atualização de conteúdo (nunca de status, data de criação ou solicitante).
export class UpdateRequestDto {
  @OptionalText('O título', 255)
  title?: string;

  @OptionalText('A descrição', 10000)
  description?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Área inválida.' })
  areaId?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;
}
