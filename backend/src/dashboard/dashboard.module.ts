import { BadRequestException, Controller, Get, Injectable, Module, Query } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { Priority, RequestStatus, UserRole } from '../common/enums';
import { RequestEntity } from '../requests/entities/request.entity';
import { DashboardQuery } from './dashboard.query';

@Injectable()
export class DashboardService {
  constructor(@InjectRepository(RequestEntity) private readonly repo: Repository<RequestEntity>) {}

  // Agregação feita no banco (COUNT + GROUP BY), nunca somando lista no frontend.
  async summary(user: AuthUser, query: DashboardQuery = {}) {
    if (query.from && query.to && query.from > query.to) {
      throw new BadRequestException('A data inicial deve ser anterior ou igual à final.');
    }
    const conditions = ['deleted_at IS NULL'];
    const params: string[] = [];
    if (user.role === UserRole.REQUESTER) {
      params.push(user.id);
      conditions.push(`requester_id = $${params.length}`);
    }
    // O dia é o do calendário de Brasília, o mesmo usado para exibir as datas na tela.
    if (query.from) {
      params.push(query.from);
      conditions.push(`created_at >= ($${params.length}::date)::timestamp AT TIME ZONE 'America/Sao_Paulo'`);
    }
    if (query.to) {
      params.push(query.to);
      conditions.push(`created_at < ($${params.length}::date + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo'`);
    }
    const where = `WHERE ${conditions.join(' AND ')}`;

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
  summary(@CurrentUser() user: AuthUser, @Query() query: DashboardQuery) {
    return this.service.summary(user, query);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([RequestEntity])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
