'use client';

import { useActionState } from 'react';
import { loginAction, type ActionState } from '../actions';

export function LoginForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(loginAction, {});
  return (
    <form action={action} className="stack">
      <div>
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username" required />
      </div>
      <div>
        <label htmlFor="password">Senha</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error && <div className="form-error" role="alert">{state.error}</div>}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
