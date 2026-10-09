import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CommentVisibility } from '../../common/enums';
import { User } from '../../users/user.entity';
import { RequestEntity } from './request.entity';

@Entity('request_comments')
export class RequestComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  requestId: string;

  @ManyToOne(() => RequestEntity, (r) => r.comments, { nullable: false })
  @JoinColumn({ name: 'request_id' })
  request: RequestEntity;

  @Column({ type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: CommentVisibility,
    enumName: 'comment_visibility',
    default: CommentVisibility.EXTERNAL,
  })
  visibility: CommentVisibility;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
