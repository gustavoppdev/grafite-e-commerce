# 12 - `proxy.ts` — checagem otimista

Status: resolved
Responsável: Claude
Blocked by: 02, 11

## O que

Exemplo trabalhado: o `proxy.ts` do Next 16 (o antigo `middleware.ts`) usado do jeito certo
— conveniência, nunca defesa.

- `src/proxy.ts`: lê **só a existência** do cookie de sessão (a função do better-auth para
  isso; sem consultar banco).
  - `/conta/*` e `/admin/*` sem cookie → `/entrar?next=<pathname>`.
  - `/entrar` e `/cadastro` com cookie → `/conta`.
  - **Não** checa papel.
- `matcher` excluindo `/api`, `_next` e estáticos.
- Comentários em pt-BR: por que só otimista (roda em todo request, inclusive prefetch),
  por que o `?next=` nasce aqui e não no `requireUser()`, por que ele nunca é a única
  defesa (CVE-2025-29927 + não roda em todo caminho de código), e que o valor do `?next=`
  é montado por nós a partir de `request.nextUrl.pathname` — mas a página `/entrar`
  passa por `safeRedirectPath` de qualquer forma, porque o parâmetro pode ser digitado.
- Conferir a doc local antes de escrever: `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`
  e `.../03-api-reference/03-file-conventions/proxy.md`.

## Critérios de aceite

- [x] `/conta` deslogado vai para `/entrar?next=/conta` e depois do login volta para `/conta`.
- [x] Logado, `/entrar` redireciona para `/conta`.
- [x] Cookie de sessão **falso** (valor inventado) não abre `/conta`: o proxy deixa passar,
      o `requireUser()` barra. Este teste é o ponto do ticket.
- [x] Nenhuma consulta ao banco no proxy (conferir com log de query).
- [x] O proxy não roda em `/api/auth/*` (senão atrapalha o cliente).
- [x] ADR 0003 continua verdadeira; complementar se precisar.
- [x] `pnpm lint`, `pnpm typecheck` e `pnpm build` passam.

## Comments

### 2026-10-01 — Claude: nota vinda do ticket 11

As rotas `/conta` e `/admin` já foram verificadas protegidas SEM proxy (ele ainda não
existia). Depois de criar o `proxy.ts`, repetir com ele renomeado para provar o mesmo com o
arquivo presente no projeto.

### 2026-10-01 — Claude: feito, sem a regra "com cookie, /entrar → /conta"

`src/proxy.ts` com `getSessionCookie` (de `better-auth/cookies`: só procura o cookie pelo
nome, sem assinatura e sem banco) e `matcher: ["/conta/:path*", "/admin/:path*"]`.

**A regra da spec que causava loop.** Escrita primeiro exatamente como a spec pedia
(`/entrar` e `/cadastro` com cookie → `/conta`) e testada com cookie inventado:
`/conta` → `/entrar` (requireUser) → `/conta` (proxy) → ..., 8 redirects e o navegador
desiste. O mesmo vale para cookie legítimo vencido ou de sessão encerrada em outro aparelho:
gente de verdade ficaria trancada fora do login. Removida. As páginas `/entrar` e
`/cadastro` já redirecionam quem está logado, validando a sessão no banco (ticket 08).
Registrado na spec (riscado com o motivo) e no ADR 0003.

**Outras decisões:**
- **`matcher` positivo** (só as áreas fechadas) em vez do negativo da spec ("tudo menos
  `/api`, `_next`, estáticos"): o proxy só tem trabalho nessas rotas, e fora delas não roda.
  `/api/auth/*` fica de fora por construção.
- **`?next=` só com o caminho**, sem a query string.
- **Visitante em `/admin` agora vai para o login** (era 404 no ticket 11). É o que a spec pede
  para o proxy, e o ticket 11 mostrou que o endereço já é público. Cliente continua com 404.
  Spec atualizada.
- ADR 0003 corrigido: dizia que o proxy redireciona "non-Admins", mas ele não olha papel.

**Verificação** (`curl` + Chrome headless + log de query do Prisma temporário, revertido;
usuário apagado):

| Caso | Resultado |
|---|---|
| Visitante `/conta`, `/conta/pedidos?x=1`, `/admin` | 307 → `/entrar?next=%2Fconta`, `...%2Fconta%2Fpedidos`, `...%2Fadmin` |
| Consultas ao banco nesses três pedidos | **0** |
| Cookie inventado em `/conta` | proxy deixa passar, `requireUser()` → `/entrar`; termina no formulário em 1 redirect |
| Cookie inventado em `/entrar` | 200, formulário (sem loop) |
| Logado: `/conta` / `/entrar` / Cliente em `/admin` | 200 / 307 → `/conta` / 404 |
| `/api/auth/get-session` com cookie inventado | 200 `null` (o proxy não roda ali) |
| Navegador: `/conta` deslogado → login | volta para `/conta` |
| Sair pelo botão de `/conta` (action = POST para `/conta`, passa pelo proxy) | volta para `/` |
| Cookie inventado no navegador → login | entra, e o login substitui o cookie ruim |
| **Proxy renomeado:** visitante `/conta`, visitante `/admin`, Cliente `/admin`, cookie inventado | 307 → `/entrar` (sem `?next`), 404, 404, 307 → `/entrar`: protegido sem ele |
