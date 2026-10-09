'use client';

import { useState, useTransition } from 'react';
import { deleteRequestAction } from '@/app/actions';

export function DeleteButton({ requestId }: { requestId: string }) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (!window.confirm('Excluir esta solicitação? Ela sai da listagem e do dashboard, mas os dados são preservados.')) return;
    setError(undefined);
    startTransition(async () => {
      const result = await deleteRequestAction(requestId);
      if (result?.error) setError(result.error);
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
