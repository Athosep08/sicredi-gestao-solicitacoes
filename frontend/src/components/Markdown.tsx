import ReactMarkdown from 'react-markdown';

// react-markdown não renderiza HTML cru por padrão, então o conteúdo digitado não vira XSS.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
