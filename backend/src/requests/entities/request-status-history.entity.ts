import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RequestStatus } from '../../common/enums';
import { User } from '../../users/user.entity';
import { RequestEntity } from './request.entity';

@Entity('request_status_history')
export class RequestStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  requestId: string;

  @ManyToOne(() => RequestEntity, (r) => r.history, { nullable: false })
  @JoinColumn({ name: 'request_id' })
  request: RequestEntity;

  @Column({ type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ type: 'enum', enum: RequestStatus, enumName: 'request_status' })
  status: RequestStatus;

  @Column({ type: 'text' })
  comment: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
