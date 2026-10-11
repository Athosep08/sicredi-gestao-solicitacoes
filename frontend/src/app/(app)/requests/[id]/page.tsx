import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApiError, api, getCurrentUser } from '@/lib/api';
import { ROLE_LABEL, formatDate } from '@/lib/labels';
import { isStaff } from '@/lib/status';
import type { RequestDetail } from '@/lib/types';
import { IconBack } from '@/components/Icons';
import { PriorityBadge, StatusBadge } from '@/components/Badges';
import { Markdown } from '@/components/Markdown';
import { CommentForm } from './CommentForm';
import { DeleteButton } from './DeleteButton';
import { StatusForm } from './StatusForm';

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  let request: RequestDetail;
  try {
    request = await api<RequestDetail>(`/requests/${id}`);
  } catch (e) {
    // 400 (id inválido), 403 e 404 viram a mesma tela: não revela se a solicitação existe.
    if (e instanceof ApiError && [400, 403, 404].includes(e.status)) notFound();
    throw e;
  }

  const staff = isStaff(user.role);

  return (
    <div>
      <Link className="back" href="/requests"><IconBack /> Solicitações</Link>
      <div className="stack">
        <div>
          <h1>{request.title}</h1>
          <div className="title-row">
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>
        </div>

        <div className="detail">
          <div className="stack">
            <section className="panel">
              <h2>Descrição</h2>
              <Markdown>{request.description}</Markdown>
            </section>

            <section className="panel">
              <h2>Histórico de status</h2>
              <ol className="timeline">
                {request.history.map((h) => (
                  <li key={h.id}>
                    <div className="event-head">
                      <StatusBadge status={h.status} />
                      <strong>{h.author.name}</strong>
                      <span>{ROLE_LABEL[h.author.role]}</span>
                      <span>{formatDate(h.createdAt)}</span>
                    </div>
                    <p className="event-body">{h.comment}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="panel">
              <h2>Comentários</h2>
              {request.comments.length === 0 && <p className="hint">Nenhum comentário ainda. Use o campo abaixo para iniciar a conversa.</p>}
              <ol className="timeline">
                {request.comments.map((c) => (
                  <li key={c.id}>
                    <div className="event-head">
                      <strong>{c.author.name}</strong>
                      <span>{ROLE_LABEL[c.author.role]}</span>
                      <span>{formatDate(c.createdAt)}</span>
                      {c.visibility === 'internal' && <span className="badge internal">Interno</span>}
                    </div>
                    <p className="event-body">{c.content}</p>
                  </li>
                ))}
              </ol>
              <CommentForm requestId={request.id} canWriteInternal={staff} />
            </section>
          </div>

          <aside className="aside">
            <section className="panel">
              <h2>Detalhes</h2>
              <dl className="meta">
                <div><dt>Área</dt><dd>{request.area.name}</dd></div>
                <div><dt>Solicitante</dt><dd>{request.requester.name}</dd></div>
                <div><dt>Criada em</dt><dd>{formatDate(request.createdAt)}</dd></div>
                <div><dt>Atualizada em</dt><dd>{formatDate(request.updatedAt)}</dd></div>
                {request.resolvedBy && <div><dt>Decidida por</dt><dd>{request.resolvedBy.name}</dd></div>}
              </dl>
            </section>

            {staff && (
              <section className="panel">
                <h2>Alterar status</h2>
                <StatusForm requestId={request.id} current={request.status} />
              </section>
            )}

            {user.role === 'supervisor' && <DeleteButton requestId={request.id} />}
          </aside>
        </div>
      </div>
    </div>
  );
}
