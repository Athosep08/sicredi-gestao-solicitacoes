'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DEFAULT_LIST_URL, loadListUrl, saveListUrl } from '@/lib/list-url';
import { IconBack } from './Icons';

/** Colocado na listagem: registra o endereço atual (visão + filtros). */
export function RememberListUrl({ url }: { url: string }) {
  useEffect(() => saveListUrl(url), [url]);
  return null;
}

/** "← Solicitações" que volta para a última listagem usada, e não sempre para a lista sem filtros. */
export function BackToList() {
  const [href, setHref] = useState(DEFAULT_LIST_URL);
  useEffect(() => setHref(loadListUrl()), []);
  return (
    <Link className="back" href={href}>
      <IconBack /> Solicitações
    </Link>
  );
}
