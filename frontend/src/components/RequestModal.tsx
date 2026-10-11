'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

/**
 * Popup do detalhe aberto a partir da listagem. Fechar volta no histórico, então a listagem
 * reaparece exatamente como estava (visão e filtros). "Abrir em tela cheia" usa um link comum
 * (navegação completa), que carrega a página do detalhe em vez de interceptá-la de novo.
 */
export function RequestModal({ id, children }: { id: string; children: React.ReactNode }) {
  const router = useRouter();
  const close = useCallback(() => router.back(), [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [close]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="modal detail-modal" role="dialog" aria-modal="true" aria-label="Detalhe da solicitação">
        <div className="detail-modal-bar">
          <a className="btn secondary" href={`/requests/${id}`}>Abrir em tela cheia</a>
          <button type="button" className="btn secondary" onClick={close} aria-label="Fechar">Fechar</button>
        </div>
        <div className="detail-modal-body">{children}</div>
      </div>
    </div>
  );
}
