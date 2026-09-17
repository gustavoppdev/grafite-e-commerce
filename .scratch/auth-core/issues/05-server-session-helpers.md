# 05 - Sessão no servidor: `getSession`, `requireUser`, `requireAdmin`

Status: open
Responsável: Claude
Blocked by: 04

## O que

Exemplo trabalhado: a fronteira de autorização do projeto inteiro. Toda feature daqui para
frente passa por estas funções.

`src/server/session.ts` (`server-only`):

- `getSession()` — envolvida em `cache()` do React, devolve sessão ou `null`.
- `requireUser()` — sem sessão, `redirect("/entrar")`; devolve o usuário tipado.
- `requireAdmin()` — sem sessão ou `role !== "admin"`, `notFound()`. Quando recusa alguém
  **logado**, registra no log do servidor com o id do usuário: a resposta na rede fica
  opaca, mas a recusa não fica invisível para nós (ver a spec — é a emenda que torna a
  escolha do 404 defensável).

Comentários em pt-BR cobrindo: por que `cache()` (header + página = uma query só, não duas),
por que `requireAdmin` devolve 404 e não 403, por que não usamos `unauthorized()`/`forbidden()`
do Next (exigem `experimental.authInterrupts`), por que estas funções são chamadas **em toda**
página/action/query e não só no `proxy.ts` (ADR 0003 e CVE-2025-29927), e por que o retorno
é um objeto enxuto em vez do registro cru do banco.

## Critérios de aceite

- [ ] `getSession()` chamada duas vezes na mesma requisição faz **uma** consulta
      (verificar com log de query do Prisma).
- [ ] `requireUser()` sem sessão redireciona para `/entrar`.
- [ ] `requireAdmin()` como Cliente cai no `not-found.tsx` **e** deixa uma linha no log do
      servidor com o id de quem tentou; como Visitante, não loga nada (não há id).
- [ ] Nada em `src/server/session.ts` é importável de Client Component (o build quebra).
- [ ] `pnpm lint`, `pnpm typecheck` e `pnpm build` passam.

## Notas

- `redirect()` e `notFound()` lançam por dentro. Chamar dentro de `try/catch` engole o
  controle de fluxo — vale um comentário avisando.
- O que essas funções devolvem vai para Server Components que podem passar props a Client
  Components. Nunca `role` a mais do que o necessário, nunca campo de ban, nunca hash.

## Comments
