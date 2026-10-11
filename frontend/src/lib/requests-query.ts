import type { RequestStatus } from './types';

export type SearchParams = Record<string, string | string[] | undefined>;
export type RequestsView = 'list' | 'kanban';

export const STATUS_ORDER: RequestStatus[] = ['open', 'in_analysis', 'approved', 'rejected'];

const FILTER_KEYS = ['search', 'status', 'priority', 'areaId', 'limit', 'order', 'page'] as const;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Só repassa filtros preenchidos: o formulário GET envia campos vazios e o backend rejeitaria "status=". */
export function cleanParams(sp: SearchParams): URLSearchParams {
  const out = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = first(sp[key]);
    if (value && value.trim() !== '') out.set(key, value.trim());
  }
  return out;
}

export function readView(sp: SearchParams): RequestsView {
  return first(sp.view) === 'kanban' ? 'kanban' : 'list';
}

/** Link para a outra visão mantendo os filtros. Paginação e itens por página só existem na lista. */
export function viewHref(query: URLSearchParams, view: RequestsView): string {
  const q = new URLSearchParams(query);
  q.delete('page');
  if (view === 'kanban') {
    q.delete('limit');
    q.set('view', 'kanban');
  }
  const qs = q.toString();
  return qs ? `/requests?${qs}` : '/requests';
}

/** Consulta de uma coluna do kanban: os mesmos filtros, fixando o status e trazendo o máximo por página. */
export function kanbanColumnQuery(query: URLSearchParams, status: RequestStatus): string {
  const q = new URLSearchParams(query);
  q.delete('page');
  q.set('status', status);
  q.set('limit', '100');
  return q.toString();
}

/** Com filtro de status, o kanban mostra só aquela coluna. */
export function kanbanStatuses(query: URLSearchParams): RequestStatus[] {
  const s = query.get('status') as RequestStatus | null;
  return s && STATUS_ORDER.includes(s) ? [s] : STATUS_ORDER;
}
