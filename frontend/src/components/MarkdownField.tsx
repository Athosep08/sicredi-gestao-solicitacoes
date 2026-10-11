'use client';

import { useState } from 'react';
import { Markdown } from './Markdown';

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
}

/** Editor markdown simples: textarea com aba de pré-visualização. */
export function MarkdownField({ id, value, onChange, onBlur, placeholder }: Props) {
  const [preview, setPreview] = useState(false);
  return (
    <div>
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={!preview} className={`tab ${!preview ? 'active' : ''}`} onClick={() => setPreview(false)}>
          Escrever
        </button>
        <button type="button" role="tab" aria-selected={preview} className={`tab ${preview ? 'active' : ''}`} onClick={() => setPreview(true)}>
          Pré-visualizar
        </button>
      </div>
      {preview ? (
        <div className="panel">{value.trim() ? <Markdown>{value}</Markdown> : <span className="hint">Nada para mostrar.</span>}</div>
      ) : (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} />
      )}
      <p className="hint">Aceita markdown (**negrito**, listas, links, código).</p>
    </div>
  );
}
