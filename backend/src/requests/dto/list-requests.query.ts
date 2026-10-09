import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
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
  search?: string;

  // Restringe a busca a um campo; sem ele busca em título + descrição.
  @IsOptional()
  @IsIn(['title', 'description'])
  searchIn?: 'title' | 'description';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @IsIn([20, 50, 100])
  limit?: number;
}
