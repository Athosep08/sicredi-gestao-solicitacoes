import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CommentVisibility } from '../../common/enums';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'O comentário não pode ser vazio.' })
  content: string;

  @IsOptional()
  @IsEnum(CommentVisibility)
  visibility?: CommentVisibility;
}
