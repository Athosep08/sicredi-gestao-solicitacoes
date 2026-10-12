import { api } from '@/lib/api';
import type { Area } from '@/lib/types';
import { RequestModal } from '@/components/RequestModal';
import { NewRequestForm } from '../../../requests/new/NewRequestForm';

// Sem esta rota estática, a interceptação de (.)requests/[id] capturaria /requests/new como se
// "new" fosse um id. Navegando de dentro do sistema, o formulário abre em popup; acesso direto
// ou recarregar mostram a página cheia (requests/new/page.tsx).
export default async function NewRequestModal() {
  const areas = await api<Area[]>('/areas');
  return (
    <RequestModal fullHref="/requests/new" label="Nova solicitação">
      <div className="stack">
        <div className="page-head">
          <div>
            <h1>Nova solicitação</h1>
            <p>Descreva o pedido. A equipe responsável analisa e registra a decisão.</p>
          </div>
        </div>
        <NewRequestForm areas={areas} />
      </div>
    </RequestModal>
  );
}
