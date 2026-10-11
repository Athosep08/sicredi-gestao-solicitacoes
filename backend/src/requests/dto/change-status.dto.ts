import { IsEnum } from 'class-validator';
import { RequestStatus } from '../../common/enums';
import { RequiredText } from '../../common/text.decorators';

export class ChangeStatusDto {
  @IsEnum(RequestStatus, { message: 'Status inválido.' })
  status: RequestStatus;

  @RequiredText('O comentário da decisão', 5000)
  comment: string;
}
