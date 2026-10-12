'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { updateRequestAction } from '@/app/actions';
import { MarkdownField } from '@/components/MarkdownField';
import { editRequestSchema, type EditRequestInput } from '@/lib/schemas';
import type { Area } from '@/lib/types';

/** Edição de título, descrição e área. Quem pode editar é decidido no servidor (e garantido pela API). */
export function EditForm({ requestId, initial, areas }: { requestId: string; initial: EditRequestInput; areas: Area[] }) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditRequestInput>({ resolver: zodResolver(editRequestSchema), defaultValues: initial });

  if (!open) {
    return <button type="button" className="btn secondary" onClick={() => setOpen(true)}>Editar solicitação</button>;
  }

  const cancel = () => {
    reset(initial);
    setServerError(undefined);
    setOpen(false);
  };

  const onSubmit = handleSubmit((values) => {
    setServerError(undefined);
    startTransition(async () => {
      const result = await updateRequestAction(requestId, values);
      if (result.error) setServerError(result.error);
      else setOpen(false);
    });
  });

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      <div>
        <label htmlFor="edit-title">Título</label>
        <input id="edit-title" maxLength={255} {...register('title')} />
        {errors.title && <p className="field-error">{errors.title.message}</p>}
      </div>
      <div>
        <label htmlFor="edit-description">Descrição</label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <MarkdownField id="edit-description" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
          )}
        />
        {errors.description && <p className="field-error">{errors.description.message}</p>}
      </div>
      <div>
        <label htmlFor="edit-area">Área</label>
        <select id="edit-area" {...register('areaId')}>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        {errors.areaId && <p className="field-error">{errors.areaId.message}</p>}
      </div>
      {serverError && <div className="form-error" role="alert">{serverError}</div>}
      <div className="row">
        <button className="btn" type="submit" disabled={pending}>{pending ? 'Salvando...' : 'Salvar alterações'}</button>
        <button className="btn secondary" type="button" onClick={cancel} disabled={pending}>Cancelar</button>
      </div>
    </form>
  );
}
