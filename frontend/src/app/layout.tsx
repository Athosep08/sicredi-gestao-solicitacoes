import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gestão de Solicitações',
  description: 'Protótipo de gestão de solicitações internas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
