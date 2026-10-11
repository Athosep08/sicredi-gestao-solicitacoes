import { describe, expect, it } from 'vitest';
import { STATUS_ORDER, cleanParams, kanbanColumnQuery, kanbanStatuses, readView, viewHref } from '../requests-query';

describe('cleanParams', () => {
  it('descarta campos vazios e parâmetros que não são filtro (como view)', () => {
    const q = cleanParams({ search: '  vpn ', status: '', priority: 'high', view: 'kanban', foo: 'x' });
    expect(q.toString()).toBe('search=vpn&priority=high');
  });
});

describe('readView', () => {
  it('lista é o padrão; só "kanban" troca a visão', () => {
    expect(readView({})).toBe('list');
    expect(readView({ view: 'kanban' })).toBe('kanban');
    expect(readView({ view: 'qualquer' })).toBe('list');
  });
});

describe('viewHref', () => {
  it('mantém os filtros e tira paginação ao ir para o kanban', () => {
    const q = new URLSearchParams('search=vpn&page=3&limit=50');
    expect(viewHref(q, 'kanban')).toBe('/requests?search=vpn&view=kanban');
  });

  it('volta para a lista sem o parâmetro view', () => {
    expect(viewHref(new URLSearchParams('priority=high'), 'list')).toBe('/requests?priority=high');
    expect(viewHref(new URLSearchParams(), 'list')).toBe('/requests');
  });
});

describe('kanban', () => {
  it('cada coluna fixa o status e pede até 100 itens, mantendo os outros filtros', () => {
    const qs = new URLSearchParams(kanbanColumnQuery(new URLSearchParams('search=vpn&page=2'), 'approved'));
    expect(qs.get('status')).toBe('approved');
    expect(qs.get('limit')).toBe('100');
    expect(qs.get('search')).toBe('vpn');
    expect(qs.has('page')).toBe(false);
  });

  it('sem filtro de status mostra as quatro colunas; com filtro, só aquela', () => {
    expect(kanbanStatuses(new URLSearchParams())).toEqual(STATUS_ORDER);
    expect(kanbanStatuses(new URLSearchParams('status=rejected'))).toEqual(['rejected']);
    expect(kanbanStatuses(new URLSearchParams('status=hack'))).toEqual(STATUS_ORDER);
  });
});
