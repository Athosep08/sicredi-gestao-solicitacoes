'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { createRequestAction } from '@/app/actions';
import { MarkdownField } from '@/components/MarkdownField';
import { PRIORITY_LABEL } from '@/lib/labels';
import { createRequestSchema, type CreateRequestInput } from '@/lib/schemas';
import type { Area } from '@/lib/types';

export function NewRequestForm({ areas }: { areas: Area[] }) {
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRequestInput>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: { title: '', description: '', areaId: '', priority: 'medium' },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(undefined);
    startTransition(async () => {
      const result = await createRequestAction(values);
      if (result.error) return setServerError(result.error);
      // Navegação completa, trocando /requests/new no histórico: o detalhe abre em página cheia
      // (não em popup sobre o formulário) e "voltar" leva para onde a pessoa estava antes.
      if (result.id) window.location.replace(`/requests/${result.id}`);
    });
  });

  return (
    <form className="panel form-card stack" onSubmit={onSubmit} noValidate>
      <div>
        <label htmlFor="new-title">Título</label>
        <input id="new-title" maxLength={255} {...register('title')} />
        {errors.title && <p className="field-error">{errors.title.message}</p>}
      </div>

      <div>
        <label htmlFor="new-description">Descrição</label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <MarkdownField id="new-description" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
          )}
        />
        {errors.description && <p className="field-error">{errors.description.message}</p>}
      </div>

      <div className="two-col">
        <div>
          <label htmlFor="new-area">Área</label>
          <select id="new-area" {...register('areaId')}>
            <option value="">Selecione...</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {errors.areaId && <p className="field-error">{errors.areaId.message}</p>}
        </div>
        <div>
          <label htmlFor="new-priority">Prioridade</label>
          <select id="new-priority" {...register('priority')}>
            {Object.entries(PRIORITY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {errors.priority && <p className="field-error">{errors.priority.message}</p>}
        </div>
      </div>

      <p className="hint">O status inicial é sempre &quot;Aberta&quot; e a data de criação é registrada automaticamente.</p>
      {serverError && <div className="form-error" role="alert">{serverError}</div>}
      <div>
        <button className="btn" type="submit" disabled={pending}>{pending ? 'Enviando...' : 'Criar solicitação'}</button>
      </div>
    </form>
  );
}
