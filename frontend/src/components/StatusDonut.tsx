interface Slice {
  key: string;
  label: string;
  value: number;
  color: string;
}

// Circunferência 100 (r = 100 / 2π): cada fatia usa a própria porcentagem como comprimento do traço.
const R = 15.9155;

/** Rosca em SVG puro (sem biblioteca de gráficos), com legenda em texto para leitores de tela. */
export function StatusDonut({ total, slices }: { total: number; slices: Slice[] }) {
  let offset = 0;
  const arcs = slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const pct = (s.value / total) * 100;
      const arc = { ...s, pct, offset };
      offset += pct;
      return arc;
    });

  return (
    <div className="donut">
      <svg viewBox="0 0 42 42" aria-hidden>
        <circle cx="21" cy="21" r={R} fill="none" stroke="#eceeec" strokeWidth="6" />
        {arcs.map((a) => (
          <circle
            key={a.key}
            cx="21"
            cy="21"
            r={R}
            fill="none"
            stroke={a.color}
            strokeWidth="6"
            strokeDasharray={`${a.pct} ${100 - a.pct}`}
            strokeDashoffset={25 - a.offset}
          />
        ))}
        <text x="21" y="21" textAnchor="middle" dominantBaseline="central" className="donut-num">{total}</text>
      </svg>
      <ul className="donut-legend">
        {slices.map((s) => (
          <li key={s.key}>
            <i style={{ background: s.color }} />
            <span>{s.label}</span>
            <strong>{s.value}</strong>
            <span className="donut-pct">{total ? Math.round((s.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
