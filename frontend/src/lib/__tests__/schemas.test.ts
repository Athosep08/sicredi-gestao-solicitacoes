import { describe, expect, it } from 'vitest';
import { changeStatusSchema, commentSchema, createRequestSchema } from '../schemas';

const valid = { title: 'Notebook novo', description: 'Preciso de um notebook', areaId: 'abc', priority: 'high' as const };

describe('createRequestSchema', () => {
  it('aceita dados válidos e remove espaços do título', () => {
    const r = createRequestSchema.safeParse({ ...valid, title: '  Notebook novo  ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.title).toBe('Notebook novo');
  });

  it('rejeita título vazio ou só com espaços', () => {
    expect(createRequestSchema.safeParse({ ...valid, title: '   ' }).success).toBe(false);
  });

  it('rejeita título com mais de 255 caracteres e aceita exatamente 255', () => {
    expect(createRequestSchema.safeParse({ ...valid, title: 'a'.repeat(256) }).success).toBe(false);
    expect(createRequestSchema.safeParse({ ...valid, title: 'a'.repeat(255) }).success).toBe(true);
  });

  it('rejeita descrição vazia, área vazia e prioridade inválida', () => {
    expect(createRequestSchema.safeParse({ ...valid, description: ' ' }).success).toBe(false);
    expect(createRequestSchema.safeParse({ ...valid, areaId: '' }).success).toBe(false);
    expect(createRequestSchema.safeParse({ ...valid, priority: 'urgente' }).success).toBe(false);
  });
});

describe('changeStatusSchema', () => {
  it('exige comentário', () => {
    expect(changeStatusSchema.safeParse({ status: 'approved', comment: '' }).success).toBe(false);
    expect(changeStatusSchema.safeParse({ status: 'approved', comment: 'ok' }).success).toBe(true);
  });

  it('rejeita status desconhecido', () => {
    expect(changeStatusSchema.safeParse({ status: 'done', comment: 'ok' }).success).toBe(false);
  });
});

describe('commentSchema', () => {
  it('exige texto e visibilidade válida', () => {
    expect(commentSchema.safeParse({ content: '', visibility: 'external' }).success).toBe(false);
    expect(commentSchema.safeParse({ content: 'oi', visibility: 'secreto' }).success).toBe(false);
    expect(commentSchema.safeParse({ content: 'oi', visibility: 'internal' }).success).toBe(true);
  });
});
