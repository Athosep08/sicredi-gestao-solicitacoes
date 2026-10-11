'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteRequestAction } from '@/app/actions';
import { loadListUrl } from '@/lib/list-url';

export function DeleteButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (!window.confirm('Excluir esta solicitação? Ela sai da listagem e do dashboard, mas os dados são preservados.')) return;
    setError(undefined);
    startTransition(async () => {
      const result = await deleteRequestAction(requestId);
      if (result?.error) return setError(result.error);
      // Volta para a última listagem usada (lista ou kanban, com filtros).
      router.replace(loadListUrl());
    });
  };

  return (
    <div>
      <button className="btn danger" type="button" onClick={onClick} disabled={pending}>
        {pending ? 'Excluindo...' : 'Excluir'}
      </button>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
