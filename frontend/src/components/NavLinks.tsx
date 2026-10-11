'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconDashboard, IconList, IconPlus } from './Icons';

const ITEMS = [
  { href: '/', label: 'Dashboard', icon: <IconDashboard />, match: (p: string) => p === '/' },
  { href: '/requests', label: 'Solicitações', icon: <IconList />, match: (p: string) => p === '/requests' || (p.startsWith('/requests/') && p !== '/requests/new') },
  { href: '/requests/new', label: 'Nova solicitação', icon: <IconPlus />, match: (p: string) => p === '/requests/new' },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="nav" aria-label="Principal">
      {ITEMS.map((i) => (
        <Link key={i.href} href={i.href} aria-current={i.match(pathname) ? 'page' : undefined}>
          {i.icon}
          <span className="label">{i.label}</span>
        </Link>
      ))}
    </nav>
  );
}
