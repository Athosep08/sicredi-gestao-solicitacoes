'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { addCommentAction } from '@/app/actions';
import { VISIBILITY_LABEL } from '@/lib/labels';
import { commentSchema, type CommentInput } from '@/lib/schemas';

export function CommentForm({ requestId, canWriteInternal }: { requestId: string; canWriteInternal: boolean }) {
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentInput>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: '', visibility: 'external' },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(undefined);
    startTransition(async () => {
      const result = await addCommentAction(requestId, values);
      if (result.error) setServerError(result.error);
      else reset({ content: '', visibility: values.visibility });
    });
  });

  return (
    <form className="stack" onSubmit={onSubmit} noValidate style={{ marginTop: '1rem' }}>
      <div>
        <label htmlFor="content">Novo comentário</label>
        <textarea id="content" style={{ minHeight: 90 }} {...register('content')} />
        {errors.content && <p className="field-error">{errors.content.message}</p>}
      </div>
      {canWriteInternal && (
        <div>
          <label htmlFor="visibility">Visibilidade</label>
          <select id="visibility" {...register('visibility')}>
            {Object.entries(VISIBILITY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      )}
      {serverError && <div className="form-error" role="alert">{serverError}</div>}
      <div>
        <button className="btn secondary" type="submit" disabled={pending}>{pending ? 'Enviando...' : 'Comentar'}</button>
      </div>
    </form>
  );
}
