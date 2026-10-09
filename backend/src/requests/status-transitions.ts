import { RequestStatus } from '../common/enums';

// Regra de negócio isolada (função pura): quais mudanças de status são válidas.
// Reabrir (approved/rejected -> open/in_analysis) é só mais um evento no histórico.
const ALLOWED: Record<RequestStatus, RequestStatus[]> = {
  [RequestStatus.OPEN]: [RequestStatus.IN_ANALYSIS, RequestStatus.APPROVED, RequestStatus.REJECTED],
  [RequestStatus.IN_ANALYSIS]: [RequestStatus.OPEN, RequestStatus.APPROVED, RequestStatus.REJECTED],
  [RequestStatus.APPROVED]: [RequestStatus.OPEN, RequestStatus.IN_ANALYSIS],
  [RequestStatus.REJECTED]: [RequestStatus.OPEN, RequestStatus.IN_ANALYSIS],
};

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return ALLOWED[from].includes(to);
}

export function isFinalDecision(status: RequestStatus): boolean {
  return status === RequestStatus.APPROVED || status === RequestStatus.REJECTED;
}
