import { LoginForm } from './LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams;
  return (
    <main className="login-wrap">
      <div className="card login-card stack">
        <h1>Gestão de Solicitações</h1>
        {expired && <div className="form-error">Sua sessão expirou. Entre novamente.</div>}
        <LoginForm />
      </div>
    </main>
  );
}
