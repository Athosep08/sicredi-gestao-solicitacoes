import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Priority } from '../../common/enums';

// Atualização de conteúdo (nunca de status, data de criação ou solicitante).
export class UpdateRequestDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsUUID('4')
  areaId?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;
}
