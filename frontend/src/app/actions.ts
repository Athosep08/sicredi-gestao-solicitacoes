'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { API_URL, ApiError, TOKEN_COOKIE, api, formatMessage } from '@/lib/api';
import { changeStatusSchema, commentSchema, createRequestSchema } from '@/lib/schemas';
import type { ChangeStatusInput, CommentInput, CreateRequestInput } from '@/lib/schemas';

export interface ActionState {
  error?: string;
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'Informe e-mail e senha.' };

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
  } catch {
    return { error: 'Não foi possível conectar ao servidor. Tente novamente em instantes.' };
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    return { error: res.status === 401 ? 'E-mail ou senha inválidos.' : (formatMessage(body?.message) ?? 'Erro ao entrar.') };
  }

  (await cookies()).set(TOKEN_COOKIE, body.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  redirect('/');
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete(TOKEN_COOKIE);
  redirect('/login');
}

function toError(e: unknown): ActionState {
  if (e instanceof ApiError) return { error: e.message };
  throw e; // redirect() e erros inesperados seguem seu caminho
}

export async function createRequestAction(input: CreateRequestInput): Promise<ActionState> {
  const parsed = createRequestSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let id: string;
  try {
    const created = await api<{ id: string }>('/requests', { method: 'POST', body: JSON.stringify(parsed.data) });
    id = created.id;
  } catch (e) {
    return toError(e);
  }
  revalidatePath('/requests');
  revalidatePath('/');
  redirect(`/requests/${id}`);
}

export async function changeStatusAction(requestId: string, input: ChangeStatusInput): Promise<ActionState> {
  const parsed = changeStatusSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await api(`/requests/${requestId}/status`, { method: 'PATCH', body: JSON.stringify(parsed.data) });
  } catch (e) {
    return toError(e);
  }
  // Mudou status: a listagem, o dashboard e o detalhe precisam ser refeitos.
  revalidatePath('/requests');
  revalidatePath('/');
  revalidatePath(`/requests/${requestId}`);
  return {};
}

export async function addCommentAction(requestId: string, input: CommentInput): Promise<ActionState> {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await api(`/requests/${requestId}/comments`, { method: 'POST', body: JSON.stringify(parsed.data) });
  } catch (e) {
    return toError(e);
  }
  revalidatePath(`/requests/${requestId}`);
  return {};
}

export async function deleteRequestAction(requestId: string): Promise<ActionState> {
  try {
    await api(`/requests/${requestId}`, { method: 'DELETE' });
  } catch (e) {
    return toError(e);
  }
  revalidatePath('/requests');
  revalidatePath('/');
  redirect('/requests');
}
