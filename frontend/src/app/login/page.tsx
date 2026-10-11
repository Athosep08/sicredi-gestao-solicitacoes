import { IconMark } from '@/components/Icons';
import { LoginForm } from './LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams;
  return (
    <div className="login">
      <main className="login-main">
        <div className="login-card stack">
          <div className="brand">
            <span className="brand-mark"><IconMark /></span>
            <span>Solicitações</span>
          </div>
          <div>
            <h1>Entrar</h1>
            <p className="hint" style={{ margin: '.2rem 0 0' }}>Use o e-mail e a senha da sua conta.</p>
          </div>
          {expired && <div className="form-error">Sua sessão expirou. Entre novamente.</div>}
          <LoginForm />
          <div className="demo">
            Contas de teste (senha <strong>Senha@123</strong>):
            <ul>
              <li>solicitante@sicredi.test</li>
              <li>atendente@sicredi.test</li>
              <li>supervisor@sicredi.test</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
