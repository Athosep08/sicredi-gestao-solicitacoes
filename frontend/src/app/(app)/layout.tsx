import Link from 'next/link';
import { logoutAction } from '../actions';
import { getCurrentUser } from '@/lib/api';
import { ROLE_LABEL } from '@/lib/labels';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">Gestão de Solicitações</span>
          <nav className="nav">
            <Link href="/">Dashboard</Link>
            <Link href="/requests">Solicitações</Link>
            <Link href="/requests/new">Nova solicitação</Link>
          </nav>
          <div className="userbox">
            <span>{user.name}</span>
            <span className="role-chip">{ROLE_LABEL[user.role]}</span>
            <form action={logoutAction}>
              <button className="btn link" type="submit">Sair</button>
            </form>
          </div>
        </div>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
