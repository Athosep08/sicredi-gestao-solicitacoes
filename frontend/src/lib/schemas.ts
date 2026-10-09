import { z } from 'zod';

export const createRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Informe o título.')
    .max(255, 'O título deve ter no máximo 255 caracteres.'),
  description: z.string().trim().min(1, 'Informe a descrição.'),
  areaId: z.string().min(1, 'Selecione a área.'),
  priority: z.enum(['low', 'medium', 'high'], { message: 'Selecione a prioridade.' }),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export const changeStatusSchema = z.object({
  status: z.enum(['open', 'in_analysis', 'approved', 'rejected'], { message: 'Selecione o novo status.' }),
  comment: z.string().trim().min(1, 'O comentário da decisão é obrigatório.'),
});

export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;

export const commentSchema = z.object({
  content: z.string().trim().min(1, 'Escreva um comentário.'),
  visibility: z.enum(['internal', 'external']),
});

export type CommentInput = z.infer<typeof commentSchema>;
