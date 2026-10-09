'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { changeStatusAction } from '@/app/actions';
import { STATUS_LABEL } from '@/lib/labels';
import { changeStatusSchema, type ChangeStatusInput } from '@/lib/schemas';
import { allowedNextStatuses } from '@/lib/status';
import type { RequestStatus } from '@/lib/types';

export function StatusForm({ requestId, current }: { requestId: string; current: RequestStatus }) {
  const options = allowedNextStatuses(current);
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangeStatusInput>({
    resolver: zodResolver(changeStatusSchema),
    defaultValues: { status: options[0], comment: '' },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(undefined);
    startTransition(async () => {
      const result = await changeStatusAction(requestId, values);
      if (result.error) setServerError(result.error);
      else reset({ status: allowedNextStatuses(values.status)[0], comment: '' });
    });
  });

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      <div>
        <label htmlFor="status">Novo status</label>
        <select id="status" {...register('status')}>
          {options.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        {errors.status && <p className="field-error">{errors.status.message}</p>}
      </div>
      <div>
        <label htmlFor="comment">Comentário da decisão (obrigatório)</label>
        <textarea id="comment" {...register('comment')} />
        {errors.comment && <p className="field-error">{errors.comment.message}</p>}
      </div>
      {serverError && <div className="form-error" role="alert">{serverError}</div>}
      <div>
        <button className="btn" type="submit" disabled={pending}>{pending ? 'Salvando...' : 'Registrar decisão'}</button>
      </div>
    </form>
  );
}
