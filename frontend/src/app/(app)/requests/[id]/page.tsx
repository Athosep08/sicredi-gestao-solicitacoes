import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/api';
import { BackToList } from '@/components/ListUrl';
import { RequestDetailView, loadRequest } from './RequestDetailView';

// Página cheia: acesso direto pelo link, recarregar ou "Abrir em tela cheia" no popup.
export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, request] = await Promise.all([getCurrentUser(), loadRequest(id)]);
  if (!request) notFound();

  return (
    <div>
      <BackToList />
      <RequestDetailView request={request} user={user} />
    </div>
  );
}
