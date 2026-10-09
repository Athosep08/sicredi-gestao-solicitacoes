import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import type { SessionUser } from './types';

export const API_URL = process.env.API_URL ?? 'http://localhost:3001';
export const TOKEN_COOKIE = 'sicredi_token';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function formatMessage(message: unknown): string | undefined {
  if (Array.isArray(message)) return message.join(' ');
  if (typeof message === 'string') return message;
  return undefined;
}

/** Chamada autenticada ao backend. Roda só no servidor: o token nunca vai para o navegador. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(503, 'Não foi possível conectar ao servidor. Tente novamente em instantes.');
  }

  if (res.status === 401) redirect('/login?expired=1');
  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, formatMessage(body?.message) ?? 'Erro inesperado.');
  return body as T;
}

export const getCurrentUser = cache(() => api<SessionUser>('/auth/me'));
