// Último endereço da listagem (visão lista/kanban + filtros), guardado na sessão do navegador
// para o "voltar" do detalhe e o redirecionamento após excluir caírem onde o usuário estava.
const KEY = 'requests:last-list-url';
export const DEFAULT_LIST_URL = '/requests';

/** Só aceita caminhos da própria listagem (evita redirecionar para fora do sistema). */
export function isListUrl(value: unknown): value is string {
  return typeof value === 'string' && /^\/requests(\?[^#]*)?$/.test(value);
}

export function saveListUrl(url: string): void {
  if (!isListUrl(url)) return;
  try {
    sessionStorage.setItem(KEY, url);
  } catch {
    // armazenamento indisponível (modo privado, bloqueado): segue com o padrão
  }
}

export function loadListUrl(): string {
  try {
    const value = sessionStorage.getItem(KEY);
    return isListUrl(value) ? value : DEFAULT_LIST_URL;
  } catch {
    return DEFAULT_LIST_URL;
  }
}
