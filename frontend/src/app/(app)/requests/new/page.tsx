import { api } from '@/lib/api';
import type { Area } from '@/lib/types';
import { NewRequestForm } from './NewRequestForm';

export default async function NewRequestPage() {
  const areas = await api<Area[]>('/areas');
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Nova solicitação</h1>
          <p>Descreva o pedido. A equipe responsável analisa e registra a decisão.</p>
        </div>
      </div>
      <NewRequestForm areas={areas} />
    </div>
  );
}
