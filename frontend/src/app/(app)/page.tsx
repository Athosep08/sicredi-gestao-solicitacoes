import Link from 'next/link';
import { api, getCurrentUser } from '@/lib/api';
import { PRIORITY_LABEL } from '@/lib/labels';
import type { DashboardSummary, Priority } from '@/lib/types';

export default async function DashboardPage() {
  const [user, d] = await Promise.all([getCurrentUser(), api<DashboardSummary>('/dashboard')]);
  const scoped = user.role === 'requester';

  const statuses = [
    { key: 'open', label: 'Abertas', value: d.open, color: 'var(--s-open)' },
    { key: 'in_analysis', label: 'Em análise', value: d.inAnalysis, color: 'var(--s-analysis)' },
    { key: 'approved', label: 'Aprovadas', value: d.approved, color: 'var(--s-approved)' },
    { key: 'rejected', label: 'Rejeitadas', value: d.rejected, color: 'var(--s-rejected)' },
  ];
  const priorities: Priority[] = ['high', 'medium', 'low'];

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>{scoped ? 'Resumo das suas solicitações.' : 'Resumo de todas as solicitações.'}</p>
        </div>
        <Link className="btn" href="/requests/new">Nova solicitação</Link>
      </div>

      <section className="stats" aria-label="Solicitações por status">
        <div className="stat-total">
          <span className="stat-num">{d.total}</span>
          <span className="stat-lbl">Total</span>
        </div>
        {statuses.map((s) => (
          <Link key={s.key} href={`/requests?status=${s.key}`}>
            <span className="stat-num">{s.value}</span>
            <span className="stat-lbl">
              <i style={{ ['--c' as string]: s.color, ['--f' as string]: s.key === 'open' ? 'transparent' : s.color }} />
              {s.label}
            </span>
          </Link>
        ))}
      </section>

      <section className="panel">
        <h2>Por prioridade</h2>
        {priorities.map((p) => {
          const value = d.byPriority[p];
          const pct = d.total ? Math.round((value / d.total) * 100) : 0;
          return (
            <div key={p} className="bar-row">
              <span>{PRIORITY_LABEL[p]}</span>
              <div className="bar-track" role="img" aria-label={`${PRIORITY_LABEL[p]}: ${value} (${pct}%)`}>
                <div className="bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <span>{value}</span>
            </div>
          );
        })}
      </section>
    </div>
  );
}
