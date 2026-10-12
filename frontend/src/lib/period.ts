const DAY = /^\d{4}-\d{2}-\d{2}$/;

export interface Period {
  from?: string;
  to?: string;
  error?: string;
}

const isRealDay = (v: string) => {
  if (!DAY.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

/** Lê de/até da URL. Valor inválido é descartado (com aviso) em vez de virar erro da API. */
export function readPeriod(sp: Record<string, string | string[] | undefined>): Period {
  const pick = (k: string) => (typeof sp[k] === 'string' && sp[k] ? (sp[k] as string) : undefined);
  let from = pick('from');
  let to = pick('to');
  let error: string | undefined;
  if ((from && !isRealDay(from)) || (to && !isRealDay(to))) {
    error = 'Data inválida; o período foi ignorado.';
    from = to = undefined;
  } else if (from && to && from > to) {
    error = 'A data inicial deve ser anterior ou igual à final; o período foi ignorado.';
    from = to = undefined;
  }
  return { from, to, error };
}
