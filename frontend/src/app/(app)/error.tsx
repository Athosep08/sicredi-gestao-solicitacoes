'use client';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card stack">
      <h1>Algo deu errado</h1>
      <p>{error.message || 'Erro inesperado.'}</p>
      <button className="btn" onClick={reset}>Tentar novamente</button>
    </div>
  );
}
