import Link from 'next/link';
import { api, getCurrentUser } from '@/lib/api';
import { isStaff } from '@/lib/status';
import { PRIORITY_LABEL, STATUS_LABEL, formatDate } from '@/lib/labels';
import {
  type SearchParams,
  cleanParams,
  kanbanColumnQuery,
  kanbanStatuses,
  readView,
  viewHref,
} from '@/lib/requests-query';
import type { Area, Paginated, RequestSummary } from '@/lib/types';
import { IconBoard, IconList } from '@/components/Icons';
import { RememberListUrl } from '@/components/ListUrl';
import { PriorityBadge, StatusBadge } from '@/components/Badges';
import { KanbanBoard, type KanbanColumn } from './KanbanBoard';

export default async function RequestsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const query = cleanParams(sp);
  const view = readView(sp);
  const kanban = view === 'kanban';

  // Lista: uma consulta paginada. Kanban: uma consulta por coluna (status), com os mesmos filtros.
  const [user, areas, list, columns] = await Promise.all([
    getCurrentUser(),
    api<Area[]>('/areas'),
    kanban ? null : api<Paginated<RequestSummary>>(`/requests?${query.toString()}`),
    kanban
      ? Promise.all(
          kanbanStatuses(query).map(async (status): Promise<KanbanColumn> => {
            const qs = kanbanColumnQuery(query, status);
            const page = await api<Paginated<RequestSummary>>(`/requests?${qs}`);
            const listQuery = new URLSearchParams(query);
            listQuery.set('status', status);
            const data = page.data.map((r) => ({ ...r, createdLabel: formatDate(r.createdAt) }));
            return { ...page, data, status, listHref: viewHref(listQuery, 'list') };
          }),
        )
      : null,
  ]);

  const total = list ? list.total : (columns ?? []).reduce((sum, c) => sum + c.total, 0);

  const pageHref = (page: number) => {
    const q = new URLSearchParams(query);
    q.set('page', String(page));
    return `/requests?${q.toString()}`;
  };

  const currentUrl = kanban ? viewHref(query, 'kanban') : `/requests${query.size ? `?${query.toString()}` : ''}`;

  return (
    <div className="stack">
      <RememberListUrl url={currentUrl} />
      <div className="page-head">
        <div>
          <h1>Solicitações</h1>
          <p>{total} {total === 1 ? 'resultado' : 'resultados'}</p>
        </div>
        <div className="row">
          <nav className="view-toggle" aria-label="Visualização">
            <Link href={viewHref(query, 'list')} aria-current={kanban ? undefined : 'page'}>
              <IconList /> Lista
            </Link>
            <Link href={viewHref(query, 'kanban')} aria-current={kanban ? 'page' : undefined}>
              <IconBoard /> Kanban
            </Link>
          </nav>
          <Link className="btn" href="/requests/new">Nova solicitação</Link>
        </div>
      </div>

      {/* Filtros viram parâmetros da URL (link compartilhável, histórico do navegador). */}
      <form className={`panel filters${kanban ? ' no-limit' : ''}`} method="GET" action="/requests">
        {kanban && <input type="hidden" name="view" value="kanban" />}
        <div>
          <label htmlFor="search">Buscar</label>
          <input id="search" name="search" defaultValue={query.get('search') ?? ''} placeholder="Título ou descrição" />
        </div>
        <div>
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={query.get('status') ?? ''}>
            <option value="">Todos</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="priority">Prioridade</label>
          <select id="priority" name="priority" defaultValue={query.get('priority') ?? ''}>
            <option value="">Todas</option>
            {Object.entries(PRIORITY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="areaId">Área</label>
          <select id="areaId" name="areaId" defaultValue={query.get('areaId') ?? ''}>
            <option value="">Todas</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        {!kanban && (
          <div>
            <label htmlFor="limit">Por página</label>
            <select id="limit" name="limit" defaultValue={query.get('limit') ?? '20'}>
              {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="order">Ordenar por data</label>
          <select id="order" name="order" defaultValue={query.get('order') ?? 'desc'}>
            <option value="desc">Mais recentes</option>
            <option value="asc">Mais antigas</option>
          </select>
        </div>
        <div className="row">
          <button className="btn" type="submit">Filtrar</button>
          <Link className="btn secondary" href={kanban ? '/requests?view=kanban' : '/requests'}>Limpar</Link>
        </div>
      </form>

      {columns && <KanbanBoard columns={columns} canMove={isStaff(user.role)} />}

      {list && (
        <div className="panel table-wrap">
          {list.data.length === 0 ? (
            <div className="empty">
              <strong>Nenhuma solicitação encontrada</strong>
              <p>Ajuste os filtros ou crie uma nova solicitação.</p>
              <Link className="btn" href="/requests/new">Nova solicitação</Link>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Área</th>
                  <th>Prioridade</th>
                  <th>Status</th>
                  <th>Solicitante</th>
                  <th>Criada em</th>
                </tr>
              </thead>
              <tbody>
                {list.data.map((r) => (
                  <tr key={r.id}>
                    <td className="title"><Link href={`/requests/${r.id}`}>{r.title}</Link></td>
                    <td>{r.area.name}</td>
                    <td><PriorityBadge priority={r.priority} /></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>{r.requester.name}</td>
                    <td>{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="pager">
            <span className="hint">Página {list.page} de {list.totalPages}</span>
            <div className="row">
              {list.page > 1 && <Link className="btn secondary" href={pageHref(list.page - 1)}>Anterior</Link>}
              {list.page < list.totalPages && <Link className="btn secondary" href={pageHref(list.page + 1)}>Próxima</Link>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
