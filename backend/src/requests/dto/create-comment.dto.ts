import { IsEnum, IsOptional } from 'class-validator';
import { CommentVisibility } from '../../common/enums';
import { RequiredText } from '../../common/text.decorators';

export class CreateCommentDto {
  @RequiredText('O comentário', 5000)
  content: string;

  @IsOptional()
  @IsEnum(CommentVisibility)
  visibility?: CommentVisibility;
}
