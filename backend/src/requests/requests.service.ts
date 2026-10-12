import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Area } from '../areas/area.entity';
import { AuthUser } from '../common/current-user.decorator';
import { CommentVisibility, Priority, RequestStatus, UserRole } from '../common/enums';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { ListRequestsQuery } from './dto/list-requests.query';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestComment } from './entities/request-comment.entity';
import { RequestStatusHistory } from './entities/request-status-history.entity';
import { RequestEntity } from './entities/request.entity';
import { canTransition, isFinalDecision } from './status-transitions';

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    @InjectRepository(RequestEntity) private readonly requests: Repository<RequestEntity>,
    @InjectRepository(RequestComment) private readonly comments: Repository<RequestComment>,
    private readonly dataSource: DataSource,
  ) {}

  private isStaff(user: AuthUser) {
    return user.role === UserRole.AGENT || user.role === UserRole.SUPERVISOR;
  }

  /** Solicitante só enxerga as próprias solicitações; atendente e supervisor veem todas. */
  private assertCanAccess(request: RequestEntity, user: AuthUser) {
    if (!this.isStaff(user) && request.requesterId !== user.id) {
      throw new ForbiddenException('Você não tem acesso a esta solicitação.');
    }
  }

  /** UUID bem formado mas inexistente violaria a FK e viraria 500; aqui vira 400 com mensagem clara. */
  private async assertAreaExists(areaId: string, em: EntityManager = this.dataSource.manager) {
    if (!(await em.exists(Area, { where: { id: areaId } }))) throw new BadRequestException('Área não encontrada.');
  }

  /** Prioridade é decisão da equipe: o solicitante não informa nem altera. */
  private assertCanSetPriority(priority: Priority | undefined, user: AuthUser) {
    if (priority !== undefined && !this.isStaff(user)) {
      throw new ForbiddenException('A prioridade é definida pela equipe de atendimento.');
    }
  }

  async create(dto: CreateRequestDto, user: AuthUser) {
    this.assertCanSetPriority(dto.priority, user);
    return this.dataSource.transaction(async (em) => {
      await this.assertAreaExists(dto.areaId, em);
      // Status inicial e solicitante nunca vêm do corpo da requisição.
      const request = await em.save(
        em.create(RequestEntity, {
          title: dto.title.trim(),
          description: dto.description,
          areaId: dto.areaId,
          priority: dto.priority ?? Priority.MEDIUM,
          status: RequestStatus.OPEN,
          requesterId: user.id,
        }),
      );
      // Criação é o primeiro evento da linha do tempo.
      await em.save(
        em.create(RequestStatusHistory, {
          requestId: request.id,
          authorId: user.id,
          status: RequestStatus.OPEN,
          comment: 'Solicitação criada.',
        }),
      );
      this.logger.log(JSON.stringify({ event: 'request.created', requestId: request.id, by: user.id }));
      return request;
    });
  }

  async list(query: ListRequestsQuery, user: AuthUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.requests
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.area', 'area')
      .leftJoinAndSelect('r.requester', 'requester')
      .select([
        'r.id', 'r.title', 'r.priority', 'r.status', 'r.createdAt', 'r.updatedAt', 'r.areaId', 'r.requesterId',
        'area.id', 'area.name', 'requester.id', 'requester.name',
      ]);

    if (!this.isStaff(user)) qb.andWhere('r.requesterId = :uid', { uid: user.id });
    if (query.status) qb.andWhere('r.status = :status', { status: query.status });
    if (query.priority) qb.andWhere('r.priority = :priority', { priority: query.priority });
    if (query.areaId) qb.andWhere('r.areaId = :areaId', { areaId: query.areaId });

    if (query.search?.trim()) {
      // %, _ e \ têm significado no LIKE; escapados, buscar "%" procura o caractere e não "tudo".
      const term = `%${query.search.trim().replace(/[\\%_]/g, '\\$&')}%`;
      const title = 'unaccent(r.title) ILIKE unaccent(:term)';
      const description = 'unaccent(r.description) ILIKE unaccent(:term)';
      const clause =
        query.searchIn === 'title' ? title : query.searchIn === 'description' ? description : `(${title} OR ${description})`;
      qb.andWhere(clause, { term });
    }

    // Ordenação determinística: data de criação + id como desempate.
    const dir = query.order === 'asc' ? 'ASC' : 'DESC';
    qb.orderBy('r.createdAt', dir).addOrderBy('r.id', dir);
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async findOne(id: string, user: AuthUser) {
    const request = await this.requests.findOne({
      where: { id },
      relations: { area: true, requester: true, resolvedBy: true },
    });
    if (!request) throw new NotFoundException('Solicitação não encontrada.');
    this.assertCanAccess(request, user);

    const history = await this.dataSource.getRepository(RequestStatusHistory).find({
      where: { requestId: id },
      relations: { author: true },
      order: { createdAt: 'ASC' },
    });

    const commentsWhere: any = { requestId: id };
    if (!this.isStaff(user)) commentsWhere.visibility = CommentVisibility.EXTERNAL;
    const comments = await this.comments.find({
      where: commentsWhere,
      relations: { author: true },
      order: { createdAt: 'ASC' },
    });

    return {
      ...request,
      requester: this.publicUser(request.requester),
      resolvedBy: request.resolvedBy ? this.publicUser(request.resolvedBy) : null,
      history: history.map((h) => ({ ...h, author: this.publicUser(h.author) })),
      comments: comments.map((c) => ({ ...c, author: this.publicUser(c.author) })),
    };
  }

  private publicUser(u: { id: string; name: string; role: UserRole }) {
    return { id: u.id, name: u.name, role: u.role };
  }

  async update(id: string, dto: UpdateRequestDto, user: AuthUser) {
    const request = await this.requests.findOne({ where: { id } });
    if (!request) throw new NotFoundException('Solicitação não encontrada.');
    this.assertCanAccess(request, user);
    this.assertCanSetPriority(dto.priority, user);

    // Solicitante só edita enquanto a solicitação ainda está aberta.
    if (!this.isStaff(user) && request.status !== RequestStatus.OPEN) {
      throw new UnprocessableEntityException('Só é possível editar solicitações com status "open".');
    }
    if (dto.areaId !== undefined) await this.assertAreaExists(dto.areaId);
    Object.assign(request, {
      ...(dto.title !== undefined && { title: dto.title.trim() }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.areaId !== undefined && { areaId: dto.areaId }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
    });
    return this.requests.save(request);
  }

  async changeStatus(id: string, dto: ChangeStatusDto, user: AuthUser) {
    return this.dataSource.transaction(async (em) => {
      const request = await em.findOne(RequestEntity, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!request) throw new NotFoundException('Solicitação não encontrada.');

      if (!canTransition(request.status, dto.status)) {
        throw new UnprocessableEntityException(
          `Transição inválida: "${request.status}" -> "${dto.status}".`,
        );
      }

      const from = request.status;
      request.status = dto.status;
      // Responsável pela decisão: preenchido ao decidir, limpo ao reabrir.
      request.resolvedById = isFinalDecision(dto.status) ? user.id : null;
      await em.save(request);

      await em.save(
        em.create(RequestStatusHistory, {
          requestId: id,
          authorId: user.id,
          status: dto.status,
          comment: dto.comment.trim(),
        }),
      );

      // Evento de negócio estruturado (trilha de auditoria).
      this.logger.log(
        JSON.stringify({ event: 'request.status_changed', requestId: id, from, to: dto.status, by: user.id }),
      );
      return request;
    });
  }

  async addComment(id: string, dto: CreateCommentDto, user: AuthUser) {
    const request = await this.requests.findOne({ where: { id } });
    if (!request) throw new NotFoundException('Solicitação não encontrada.');
    this.assertCanAccess(request, user);

    // Solicitante nunca cria comentário interno.
    const visibility = this.isStaff(user) ? (dto.visibility ?? CommentVisibility.EXTERNAL) : CommentVisibility.EXTERNAL;
    const comment = await this.comments.save(
      this.comments.create({ requestId: id, authorId: user.id, content: dto.content.trim(), visibility }),
    );
    return { ...comment, author: this.publicUser(user) };
  }

  async remove(id: string, user: AuthUser) {
    const request = await this.requests.findOne({ where: { id } });
    if (!request) throw new NotFoundException('Solicitação não encontrada.');
    // Soft delete: preserva o dado (LGPD art. 16, II) e tira da listagem/dashboard.
    await this.requests.softDelete(id);
    this.logger.log(JSON.stringify({ event: 'request.deleted', requestId: id, by: user.id }));
  }
}
