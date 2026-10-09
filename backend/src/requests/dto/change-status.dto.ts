import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { RequestStatus } from '../../common/enums';

export class ChangeStatusDto {
  @IsEnum(RequestStatus, { message: 'Status inválido.' })
  status: RequestStatus;

  @IsString()
  @IsNotEmpty({ message: 'O comentário da decisão é obrigatório.' })
  comment: string;
}
