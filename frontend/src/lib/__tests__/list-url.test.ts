import { beforeEach, describe, expect, it } from 'vitest';
import { isListUrl, loadListUrl, saveListUrl } from '../list-url';

describe('isListUrl', () => {
  it('aceita só endereços da própria listagem', () => {
    expect(isListUrl('/requests')).toBe(true);
    expect(isListUrl('/requests?view=kanban&priority=high')).toBe(true);
  });

  it('rejeita outros caminhos e endereços externos', () => {
    for (const bad of ['/requests/123', '/', '//evil.com', 'https://evil.com/requests', '/requestsX', '/requests#x', null, 42]) {
      expect(isListUrl(bad)).toBe(false);
    }
  });
});

describe('saveListUrl / loadListUrl', () => {
  beforeEach(() => sessionStorage.clear());

  it('sem nada guardado volta para a lista padrão', () => {
    expect(loadListUrl()).toBe('/requests');
  });

  it('guarda e devolve a última listagem (visão e filtros)', () => {
    saveListUrl('/requests?view=kanban&search=vpn');
    expect(loadListUrl()).toBe('/requests?view=kanban&search=vpn');
  });

  it('ignora valor inválido ao salvar e ao ler', () => {
    saveListUrl('https://evil.com');
    expect(loadListUrl()).toBe('/requests');
    sessionStorage.setItem('requests:last-list-url', '//evil.com');
    expect(loadListUrl()).toBe('/requests');
  });
});
