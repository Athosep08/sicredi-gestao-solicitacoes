import { logoutAction } from '../actions';
import { getCurrentUser } from '@/lib/api';
import { ROLE_LABEL } from '@/lib/labels';
import { IconLogout, IconMark } from '@/components/Icons';
import { NavLinks } from '@/components/NavLinks';

export default async function AppLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  const user = await getCurrentUser();
  const initials = user.name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><IconMark /></span>
          <span>Solicitações<small>Gestão interna</small></span>
        </div>
        <NavLinks />
        <div className="sidebar-foot">
          <div className="who">
            <span className="avatar" aria-hidden>{initials}</span>
            <div style={{ minWidth: 0 }}>
              <div className="who-name">{user.name}</div>
              <div className="who-role">{ROLE_LABEL[user.role]}</div>
            </div>
          </div>
          <form action={logoutAction}>
            <button className="signout" type="submit"><IconLogout /> Sair</button>
          </form>
        </div>
      </aside>
      <main className="content">{children}</main>
      {modal}
    </div>
  );
}
