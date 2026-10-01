import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/*
  O `proxy.ts` (o antigo `middleware.ts`) roda ANTES da página, em toda requisição que o
  `matcher` cobre. Aqui ele é só CONVENIÊNCIA: manda quem claramente não está logado para o
  login, guardando a página que a pessoa queria abrir.

  NÃO É A PROTEÇÃO. Quem protege `/conta` e `/admin` é o `requireUser()`/`requireAdmin()`
  dentro de cada página (ADR 0003), por dois motivos:
  - O proxy já foi contornado. A CVE-2025-29927 deixava pular o middleware do Next com um
    único header na requisição; quem dependia só dele ficou com a área logada aberta.
  - Ele não cobre todo caminho de código. Uma server action é um POST para a rota onde está
    sendo usada; mudar o `matcher` ou mover a action de rota tira a cobertura em silêncio.

  OTIMISTA: só confere se o cookie de sessão EXISTE. Não valida a assinatura nem consulta o
  banco, porque roda em toda requisição coberta, inclusive nos prefetches dos links (o Next
  busca a página antes do clique). Uma consulta aqui multiplicaria as idas ao banco por
  navegação. Um cookie inventado passa por aqui, e é barrado pela página.
*/
export function proxy(request: NextRequest) {
  if (getSessionCookie(request) !== null) return NextResponse.next();

  /*
    O `?next=` nasce AQUI, e não no `requireUser()`, porque o proxy é quem sabe qual página
    a pessoa pediu. O valor é montado por nós a partir do caminho da requisição, mas a
    página `/entrar` passa o parâmetro pelo `safeRedirectPath` mesmo assim: qualquer um pode
    digitar `/entrar?next=...` à mão, sem passar por aqui.

    Só o caminho, sem a query string: `?next=/conta/pedidos`, e não a URL inteira.
  */
  const signIn = new URL("/entrar", request.url);
  signIn.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(signIn);
}

/*
  Só as áreas fechadas. Fora delas o proxy nem roda: nada de `/api/auth/*` (atrapalharia o
  cliente do better-auth), nada de arquivo estático.

  DE PROPÓSITO, não existe a regra inversa ("com cookie, `/entrar` vai para `/conta`"),
  embora a spec a pedisse. Testado no ticket 12: com um cookie que existe mas não vale
  (sessão vencida, encerrada em outro aparelho, ou inventada), o proxy mandava de `/entrar`
  para `/conta`, o `requireUser()` mandava de volta para `/entrar`, e o navegador desistia
  com "redirecionamentos demais". A pessoa ficaria trancada fora do login. As páginas
  `/entrar` e `/cadastro` já redirecionam quem está logado, e com a sessão validada no
  banco, que é o que separa um cookie bom de um ruim.
*/
export const config = {
  matcher: ["/conta/:path*", "/admin/:path*"],
};
