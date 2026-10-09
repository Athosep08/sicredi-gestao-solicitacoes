import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Area } from '../../areas/area.entity';
import { Priority, RequestStatus } from '../../common/enums';
import { User } from '../../users/user.entity';
import { RequestComment } from './request-comment.entity';
import { RequestStatusHistory } from './request-status-history.entity';

@Entity('requests')
export class RequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'uuid' })
  areaId: string;

  @ManyToOne(() => Area, { nullable: false })
  @JoinColumn({ name: 'area_id' })
  area: Area;

  @Column({ type: 'enum', enum: Priority, enumName: 'priority_level' })
  priority: Priority;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    enumName: 'request_status',
    default: RequestStatus.OPEN,
  })
  status: RequestStatus;

  @Column({ type: 'uuid' })
  requesterId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @Column({ type: 'uuid', nullable: true })
  resolvedById: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolved_by_id' })
  resolvedBy: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;

  @OneToMany(() => RequestStatusHistory, (h) => h.request)
  history: RequestStatusHistory[];

  @OneToMany(() => RequestComment, (c) => c.request)
  comments: RequestComment[];
}
