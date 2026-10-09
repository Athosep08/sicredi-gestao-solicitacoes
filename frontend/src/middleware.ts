import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Só verifica se existe sessão. Quem valida o token de verdade é o backend.
export function middleware(req: NextRequest) {
  const hasToken = req.cookies.has('sicredi_token');
  const isLogin = req.nextUrl.pathname === '/login';
  if (!hasToken && !isLogin) return NextResponse.redirect(new URL('/login', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
