import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { Priority, RequestStatus } from '../../common/enums';

export class ListRequestsQuery {
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsUUID('4')
  areaId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'A busca deve ter no máximo 100 caracteres.' })
  search?: string;

  // Restringe a busca a um campo; sem ele busca em título + descrição.
  @IsOptional()
  @IsIn(['title', 'description'])
  searchIn?: 'title' | 'description';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @IsOptional()
  // Number() (e não parseInt) rejeita "20abc" e "1.5" em vez de aceitar só o prefixo numérico.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([20, 50, 100])
  limit?: number;
}
