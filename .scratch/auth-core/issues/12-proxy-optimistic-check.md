# 12 - `proxy.ts` — checagem otimista

Status: open
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

- [ ] `/conta` deslogado vai para `/entrar?next=/conta` e depois do login volta para `/conta`.
- [ ] Logado, `/entrar` redireciona para `/conta`.
- [ ] Cookie de sessão **falso** (valor inventado) não abre `/conta`: o proxy deixa passar,
      o `requireUser()` barra. Este teste é o ponto do ticket.
- [ ] Nenhuma consulta ao banco no proxy (conferir com log de query).
- [ ] O proxy não roda em `/api/auth/*` (senão atrapalha o cliente).
- [ ] ADR 0003 continua verdadeira; complementar se precisar.
- [ ] `pnpm lint`, `pnpm typecheck` e `pnpm build` passam.

## Comments
