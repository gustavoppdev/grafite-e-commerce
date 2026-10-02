import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

// Conveniência, não proteção: quem protege é a página (ADR 0003; o middleware já foi
// contornado, CVE-2025-29927). Otimista: só olha se o cookie existe, sem banco, porque roda
// até em prefetch. Cookie inventado passa aqui e é barrado na página.
export function proxy(request: NextRequest) {
  if (getSessionCookie(request) !== null) return NextResponse.next();

  // O `?next=` nasce aqui (só o caminho); `/entrar` o valida mesmo assim.
  const signIn = new URL("/entrar", request.url);
  signIn.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(signIn);
}

// Só as áreas fechadas. Sem a regra "com cookie, /entrar → /conta": com cookie vencido ela
// fazia loop com o `requireUser()`. As páginas de login já redirecionam quem está logado.
export const config = {
  matcher: ["/conta/:path*", "/admin/:path*"],
};
