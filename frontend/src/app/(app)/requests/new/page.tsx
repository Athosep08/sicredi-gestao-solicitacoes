import { api, getCurrentUser } from '@/lib/api';
import { isStaff } from '@/lib/status';
import type { Area } from '@/lib/types';
import { NewRequestForm } from './NewRequestForm';

export default async function NewRequestPage() {
  const [user, areas] = await Promise.all([getCurrentUser(), api<Area[]>('/areas')]);
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Nova solicitação</h1>
          <p>Descreva o pedido. A equipe responsável analisa e registra a decisão.</p>
        </div>
      </div>
      <NewRequestForm areas={areas} canSetPriority={isStaff(user.role)} />
    </div>
  );
}
