import { api, getCurrentUser } from '@/lib/api';
import { PRIORITY_LABEL } from '@/lib/labels';
import type { DashboardSummary, Priority } from '@/lib/types';

export default async function DashboardPage() {
  const [user, d] = await Promise.all([getCurrentUser(), api<DashboardSummary>('/dashboard')]);
  const scoped = user.role === 'requester';

  const cards = [
    { label: 'Total', value: d.total },
    { label: 'Abertas', value: d.open },
    { label: 'Em análise', value: d.inAnalysis },
    { label: 'Aprovadas', value: d.approved },
    { label: 'Rejeitadas', value: d.rejected },
  ];
  const priorities: Priority[] = ['high', 'medium', 'low'];

  return (
    <div className="stack">
      <h1>Dashboard</h1>
      {scoped && <p className="hint">Mostrando apenas as suas solicitações.</p>}
      <section className="grid-cards">
        {cards.map((c) => (
          <div key={c.label} className="card stat">
            <div className="num">{c.value}</div>
            <div className="lbl">{c.label}</div>
          </div>
        ))}
      </section>
      <section className="card">
        <h2>Distribuição por prioridade</h2>
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
