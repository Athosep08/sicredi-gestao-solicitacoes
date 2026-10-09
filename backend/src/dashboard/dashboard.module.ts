import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { Priority, RequestStatus, UserRole } from '../common/enums';
import { RequestEntity } from '../requests/entities/request.entity';

@Injectable()
export class DashboardService {
  constructor(@InjectRepository(RequestEntity) private readonly repo: Repository<RequestEntity>) {}

  // Agregação feita no banco (COUNT + GROUP BY), nunca somando lista no frontend.
  async summary(user: AuthUser) {
    const scoped = user.role === UserRole.REQUESTER;
    const where = scoped ? 'WHERE deleted_at IS NULL AND requester_id = $1' : 'WHERE deleted_at IS NULL';
    const params = scoped ? [user.id] : [];

    const byStatus: { status: RequestStatus; count: string }[] = await this.repo.query(
      `SELECT status, COUNT(*)::text AS count FROM requests ${where} GROUP BY status`,
      params,
    );
    const byPriority: { priority: Priority; count: string }[] = await this.repo.query(
      `SELECT priority, COUNT(*)::text AS count FROM requests ${where} GROUP BY priority`,
      params,
    );

    const statusCount = (s: RequestStatus) => Number(byStatus.find((r) => r.status === s)?.count ?? 0);
    const priorityCount = (p: Priority) => Number(byPriority.find((r) => r.priority === p)?.count ?? 0);

    return {
      total: byStatus.reduce((acc, r) => acc + Number(r.count), 0),
      open: statusCount(RequestStatus.OPEN),
      inAnalysis: statusCount(RequestStatus.IN_ANALYSIS),
      approved: statusCount(RequestStatus.APPROVED),
      rejected: statusCount(RequestStatus.REJECTED),
      byPriority: {
        low: priorityCount(Priority.LOW),
        medium: priorityCount(Priority.MEDIUM),
        high: priorityCount(Priority.HIGH),
      },
    };
  }
}

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  summary(@CurrentUser() user: AuthUser) {
    return this.service.summary(user);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([RequestEntity])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
