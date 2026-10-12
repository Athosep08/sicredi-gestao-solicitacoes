'use client';

import { useState } from 'react';

/**
 * Formulário de filtros da listagem. No celular os campos ficam recolhidos atrás do botão
 * "Filtros" (só a busca aparece), para a lista não começar meia tela abaixo; no desktop o botão
 * some e tudo fica visível (CSS).
 */
export function FiltersForm({ className, active, children }: { className: string; active: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <form className={`${className}${open ? ' open' : ''}`} method="GET" action="/requests">
      <button type="button" className="btn secondary filters-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? 'Esconder filtros' : 'Filtros'}
        {active > 0 && <span className="filters-count">{active}</span>}
      </button>
      {children}
    </form>
  );
}
