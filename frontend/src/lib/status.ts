import type { RequestStatus, UserRole } from './types';

// Espelho da regra do backend (requests/status-transitions.ts), só para esconder
// opções inválidas na tela. Quem decide de verdade é sempre o backend.
const ALLOWED: Record<RequestStatus, RequestStatus[]> = {
  open: ['in_analysis', 'approved', 'rejected'],
  in_analysis: ['open', 'approved', 'rejected'],
  approved: ['open', 'in_analysis'],
  rejected: ['open', 'in_analysis'],
};

export function allowedNextStatuses(from: RequestStatus): RequestStatus[] {
  return ALLOWED[from];
}

export function isStaff(role: UserRole): boolean {
  return role === 'agent' || role === 'supervisor';
}
