import Link from 'next/link';
import { api, getCurrentUser } from '@/lib/api';
import { PRIORITY_LABEL } from '@/lib/labels';
import { readPeriod } from '@/lib/period';
import type { DashboardSummary, Priority } from '@/lib/types';
import { StatusDonut } from '@/components/StatusDonut';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const period = readPeriod(await searchParams);
  const qs = new URLSearchParams();
  if (period.from) qs.set('from', period.from);
  if (period.to) qs.set('to', period.to);

  const [user, d] = await Promise.all([getCurrentUser(), api<DashboardSummary>(`/dashboard${qs.size ? `?${qs}` : ''}`)]);
  const scoped = user.role === 'requester';
  const filtered = !!(period.from || period.to);

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

      {/* Período sobre a data de criação; vira parâmetro da URL, como os filtros da listagem. */}
      <form className="period" method="GET" action="/">
        <div>
          <label htmlFor="from">De</label>
          <input id="from" name="from" type="date" defaultValue={period.from ?? ''} />
        </div>
        <div>
          <label htmlFor="to">Até</label>
          <input id="to" name="to" type="date" defaultValue={period.to ?? ''} />
        </div>
        <div className="row">
          <button className="btn" type="submit">Aplicar</button>
          {filtered && <Link className="btn secondary" href="/">Limpar</Link>}
        </div>
        {period.error && <p className="field-error period-error">{period.error}</p>}
      </form>

      <section className="stats" aria-label="Solicitações por status">
        <div className="stat-total">
          <span className="stat-num">{d.total}</span>
          <span className="stat-lbl">Total{filtered ? ' no período' : ''}</span>
        </div>
        {statuses.map((s) => {
          const content = (
            <>
              <span className="stat-num">{s.value}</span>
              <span className="stat-lbl">
                <i style={{ ['--c' as string]: s.color, ['--f' as string]: s.key === 'open' ? 'transparent' : s.color }} />
                {s.label}
              </span>
            </>
          );
          // A listagem não filtra por data: com período ativo o número não vira link, para não levar a uma contagem diferente.
          return filtered ? (
            <div key={s.key}>{content}</div>
          ) : (
            <Link key={s.key} href={`/requests?status=${s.key}`}>{content}</Link>
          );
        })}
      </section>

      <div className="dash-grid">
        <section className="panel">
          <h2>Por status</h2>
          <StatusDonut total={d.total} slices={statuses} />
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
    </div>
  );
}
