import { PRIORITY_LABEL, STATUS_LABEL } from '@/lib/labels';
import type { Priority, RequestStatus } from '@/lib/types';

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`badge ${status}`}>{STATUS_LABEL[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`badge ${priority}`}>{PRIORITY_LABEL[priority]}</span>;
}
