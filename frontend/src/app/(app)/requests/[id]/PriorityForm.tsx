'use client';

import { useState, useTransition } from 'react';
import { changePriorityAction } from '@/app/actions';
import { PRIORITY_LABEL } from '@/lib/labels';
import type { Priority } from '@/lib/types';

/** Prioridade é decisão da equipe: atendente e supervisor ajustam aqui; o solicitante só vê. */
export function PriorityForm({ requestId, current }: { requestId: string; current: Priority }) {
  const [priority, setPriority] = useState<Priority>(current);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await changePriorityAction(requestId, priority);
      if (result.error) setError(result.error);
    });
  };

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <div>
        <label htmlFor="priority-level">Prioridade</label>
        <select id="priority-level" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          {Object.entries(PRIORITY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div>
        <button className="btn secondary" type="submit" disabled={pending || priority === current}>
          {pending ? 'Salvando...' : 'Salvar prioridade'}
        </button>
      </div>
    </form>
  );
}
