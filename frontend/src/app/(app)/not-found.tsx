import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="card stack">
      <h1>Não encontrado</h1>
      <p>Essa solicitação não existe ou você não tem acesso a ela.</p>
      <Link className="btn secondary" href="/requests">Voltar para a lista</Link>
    </div>
  );
}
