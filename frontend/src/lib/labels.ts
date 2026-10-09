import type { CommentVisibility, Priority, RequestStatus, UserRole } from './types';

export const STATUS_LABEL: Record<RequestStatus, string> = {
  open: 'Aberta',
  in_analysis: 'Em análise',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  requester: 'Solicitante',
  agent: 'Atendente',
  supervisor: 'Supervisor',
};

export const VISIBILITY_LABEL: Record<CommentVisibility, string> = {
  internal: 'Interno (só a equipe)',
  external: 'Externo (solicitante vê)',
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
