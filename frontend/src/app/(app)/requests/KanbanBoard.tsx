'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { changeStatusAction } from '@/app/actions';
import { PriorityBadge, StatusBadge } from '@/components/Badges';
import { STATUS_LABEL } from '@/lib/labels';
import { changeStatusSchema } from '@/lib/schemas';
import { allowedNextStatuses } from '@/lib/status';
import type { Paginated, RequestStatus, RequestSummary } from '@/lib/types';

// A data chega formatada do servidor para o HTML do servidor e o do navegador serem idênticos.
export type KanbanCard = RequestSummary & { createdLabel: string };

export interface KanbanColumn extends Omit<Paginated<KanbanCard>, 'data'> {
  data: KanbanCard[];
  status: RequestStatus;
  listHref: string;
}

interface Move {
  id: string;
  title: string;
  from: RequestStatus;
  to: RequestStatus;
}

/**
 * Arrastar um card para outra coluna muda o status. Como a regra exige comentário, soltar o card
 * abre uma janela pedindo o comentário; a mudança só acontece ao confirmar, pela mesma action da
 * tela de detalhe. Só atendente e supervisor arrastam; as colunas não permitidas ficam apagadas.
 */
export function KanbanBoard({ columns, canMove }: { columns: KanbanColumn[]; canMove: boolean }) {
  const [dragging, setDragging] = useState<{ id: string; title: string; from: RequestStatus } | null>(null);
  const [move, setMove] = useState<Move | null>(null);

  const canDrop = (to: RequestStatus) => !!dragging && allowedNextStatuses(dragging.from).includes(to);

  return (
    <>
      <div className={`kanban${columns.length === 1 ? ' single' : ''}${dragging ? ' is-dragging' : ''}`}>
        {columns.map((c) => {
          const state = !dragging ? '' : canDrop(c.status) ? ' drop-ok' : c.status === dragging.from ? '' : ' drop-no';
          return (
            <section
              key={c.status}
              className={`kanban-col${state}`}
              aria-label={`Coluna ${STATUS_LABEL[c.status]}`}
              onDragOver={(e) => {
                if (!canDrop(c.status)) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragging && canDrop(c.status)) setMove({ ...dragging, to: c.status });
                setDragging(null);
              }}
            >
              <header className="kanban-head">
                <StatusBadge status={c.status} />
                <span className="kanban-count">{c.total}</span>
              </header>
              <div className="kanban-cards">
                {c.data.length === 0 && <p className="kanban-empty">Nenhuma solicitação</p>}
                {c.data.map((r) => (
                  <Link
                    key={r.id}
                    href={`/requests/${r.id}`}
                    className={`kanban-card${dragging?.id === r.id ? ' dragging' : ''}`}
                    draggable={canMove}
                    onDragStart={(e) => {
                      if (!canMove) return;
                      e.dataTransfer.setData('text/plain', r.id);
                      e.dataTransfer.effectAllowed = 'move';
                      setDragging({ id: r.id, title: r.title, from: r.status });
                    }}
                    onDragEnd={() => setDragging(null)}
                  >
                    <span className="kanban-title">{r.title}</span>
                    <span className="kanban-meta">
                      <PriorityBadge priority={r.priority} />
                      <span>{r.area.name}</span>
                    </span>
                    <span className="kanban-foot">
                      <span>{r.requester.name}</span>
                      <span>{r.createdLabel}</span>
                    </span>
                  </Link>
                ))}
                {c.total > c.data.length && (
                  <Link className="kanban-more" href={c.listHref}>
                    Ver todas as {c.total} na lista
                  </Link>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {canMove && <p className="hint kanban-hint">Arraste um card para outra coluna para mudar o status.</p>}
      {move && <MoveDialog move={move} onClose={() => setMove(null)} />}
    </>
  );
}

function MoveDialog({ move, onClose }: { move: Move; onClose: () => void }) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = changeStatusSchema.safeParse({ status: move.to, comment });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setError(undefined);
    startTransition(async () => {
      const result = await changeStatusAction(move.id, parsed.data);
      if (result.error) setError(result.error);
      else onClose();
    });
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !pending && onClose()}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-title"
        onSubmit={submit}
        onKeyDown={(e) => e.key === 'Escape' && !pending && onClose()}
        noValidate
      >
        <h2 id="move-title" className="modal-title">Mudar status</h2>
        <p className="modal-text">
          <strong>{move.title}</strong>
          <span className="modal-move">
            <StatusBadge status={move.from} /> <span aria-hidden>→</span> <StatusBadge status={move.to} />
          </span>
        </p>
        <div>
          <label htmlFor="move-comment">Comentário da decisão (obrigatório)</label>
          <textarea id="move-comment" autoFocus value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="row modal-actions">
          <button type="button" className="btn secondary" onClick={onClose} disabled={pending}>Cancelar</button>
          <button type="submit" className="btn" disabled={pending}>{pending ? 'Salvando...' : 'Mudar status'}</button>
        </div>
      </form>
    </div>
  );
}
