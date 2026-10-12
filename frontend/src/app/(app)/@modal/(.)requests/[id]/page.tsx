import { getCurrentUser } from '@/lib/api';
import { RequestModal } from '@/components/RequestModal';
import { RequestDetailView, loadRequest } from '../../../requests/[id]/RequestDetailView';

// Rota interceptada: navegando de dentro do sistema para /requests/:id, o detalhe abre em popup
// sobre a listagem. Acesso direto ou recarregar a página mostram a página cheia (requests/[id]/page.tsx).
export default async function RequestDetailModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, request] = await Promise.all([getCurrentUser(), loadRequest(id)]);

  return (
    <RequestModal fullHref={`/requests/${id}`} label="Detalhe da solicitação">
      {request ? (
        <RequestDetailView request={request} user={user} />
      ) : (
        <p>Essa solicitação não existe ou você não tem acesso a ela.</p>
      )}
    </RequestModal>
  );
}
