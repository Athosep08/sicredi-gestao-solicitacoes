import Link from 'next/link';
import { api } from '@/lib/api';
import { PRIORITY_LABEL, STATUS_LABEL, formatDate } from '@/lib/labels';
import type { Area, Paginated, RequestSummary } from '@/lib/types';
import { PriorityBadge, StatusBadge } from '@/components/Badges';

type Params = Record<string, string | string[] | undefined>;

const FILTER_KEYS = ['search', 'status', 'priority', 'areaId', 'limit', 'order', 'page'] as const;

/** Só repassa filtros preenchidos: o formulário GET envia campos vazios e o backend rejeitaria "status=". */
function cleanParams(sp: Params): URLSearchParams {
  const out = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const raw = sp[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value && value.trim() !== '') out.set(key, value.trim());
  }
  return out;
}

export default async function RequestsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const query = cleanParams(sp);
  const [list, areas] = await Promise.all([
    api<Paginated<RequestSummary>>(`/requests?${query.toString()}`),
    api<Area[]>('/areas'),
  ]);

  const pageHref = (page: number) => {
    const q = new URLSearchParams(query);
    q.set('page', String(page));
    return `/requests?${q.toString()}`;
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Solicitações</h1>
          <p>{list.total} {list.total === 1 ? 'resultado' : 'resultados'}</p>
        </div>
        <Link className="btn" href="/requests/new">Nova solicitação</Link>
      </div>

      {/* Filtros viram parâmetros da URL (link compartilhável, histórico do navegador). */}
      <form className="panel filters" method="GET" action="/requests">
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
        <div>
          <label htmlFor="limit">Por página</label>
          <select id="limit" name="limit" defaultValue={query.get('limit') ?? '20'}>
            {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="order">Ordenar por data</label>
          <select id="order" name="order" defaultValue={query.get('order') ?? 'desc'}>
            <option value="desc">Mais recentes</option>
            <option value="asc">Mais antigas</option>
          </select>
        </div>
        <div className="row">
          <button className="btn" type="submit">Filtrar</button>
          <Link className="btn secondary" href="/requests">Limpar</Link>
        </div>
      </form>

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
    </div>
  );
}
