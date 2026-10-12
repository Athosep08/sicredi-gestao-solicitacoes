'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

/**
 * Popup aberto a partir da navegação interna (detalhe ou nova solicitação). Fechar volta no
 * histórico, então a página de trás reaparece exatamente como estava (visão e filtros).
 * "Abrir em tela cheia" usa um link comum (navegação completa), que carrega a página inteira
 * em vez de interceptá-la de novo.
 */
export function RequestModal({ fullHref, label, children }: { fullHref: string; label: string; children: React.ReactNode }) {
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
      <div className="modal detail-modal" role="dialog" aria-modal="true" aria-label={label}>
        <div className="detail-modal-bar">
          <a className="btn secondary" href={fullHref}>Abrir em tela cheia</a>
          <button type="button" className="btn secondary" onClick={close} aria-label="Fechar">Fechar</button>
        </div>
        <div className="detail-modal-body">{children}</div>
      </div>
    </div>
  );
}
