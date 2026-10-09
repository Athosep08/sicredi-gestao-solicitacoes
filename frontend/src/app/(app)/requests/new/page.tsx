import { api } from '@/lib/api';
import type { Area } from '@/lib/types';
import { NewRequestForm } from './NewRequestForm';

export default async function NewRequestPage() {
  const areas = await api<Area[]>('/areas');
  return (
    <div className="stack">
      <h1>Nova solicitação</h1>
      <NewRequestForm areas={areas} />
    </div>
  );
}
