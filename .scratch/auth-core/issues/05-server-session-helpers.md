# 05 - Sessão no servidor: `getSession`, `requireUser`, `requireAdmin`

Status: resolved
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

- [x] `getSession()` chamada duas vezes na mesma requisição faz **uma** consulta
      (verificar com log de query do Prisma).
- [x] `requireUser()` sem sessão redireciona para `/entrar`.
- [x] `requireAdmin()` como Cliente cai no `not-found.tsx` **e** deixa uma linha no log do
      servidor com o id de quem tentou; como Visitante, não loga nada (não há id).
- [x] Nada em `src/server/session.ts` é importável de Client Component (o build quebra).
- [x] `pnpm lint`, `pnpm typecheck` e `pnpm build` passam.

## Notas

- `redirect()` e `notFound()` lançam por dentro. Chamar dentro de `try/catch` engole o
  controle de fluxo — vale um comentário avisando.
- O que essas funções devolvem vai para Server Components que podem passar props a Client
  Components. Nunca `role` a mais do que o necessário, nunca campo de ban, nunca hash.

## Comments

### 2026-10-01 — Claude: feito e verificado

`src/server/session.ts` com `getSession` (em `cache()`), `requireUser`, `requireAdmin` e o
tipo `SessionUser` (`id`, `name`, `email`, `role`).

**Decisões:**

- **Retorno enxuto (DTO).** Copiamos só `id`, `name`, `email` e `role`, em vez de repassar
  o `session.user` do better-auth. O que sai daqui pode virar prop de Client Component, que
  é serializada no HTML. Um campo novo na tabela (ou os de ban) só aparece se alguém o
  acrescentar de propósito no tipo.
- **`role` normalizado para `"user" | "admin"`.** O plugin admin guarda texto e aceita
  vários papéis separados por vírgula. `toRole` confere igual ao plugin
  (`plugins/admin/routes.mjs`, `split(",")`), para os dois nunca discordarem sobre quem é
  Admin. Qualquer outro valor, inclusive `null`, vira `"user"`: na dúvida, o menor
  privilégio.
- **Log da recusa só com o id**, via `console.warn` (vai para os logs da Vercel). Nome e
  e-mail são dado pessoal e não precisam estar no log.
- **Refresh da sessão em Server Component** é tratado pela biblioteca: o `nextCookies()`
  detecta requisição RSC e pula o refresh, porque ali não dá para gravar cookie
  (`integrations/next-js.mjs`). Nada a fazer do nosso lado.

**Verificação** (páginas temporárias + log de query do Prisma, tudo removido depois):

| Cenário | Resultado |
|---|---|
| `getSession()` 2× na mesma requisição (página + componente filho) | 1 leitura de sessão: 2 SELECTs (`session` + `user`) |
| Prova contrária: `auth.api.getSession` 2× sem `cache()` | 2 leituras: 4 SELECTs |
| Visitante: `getSession()` | nenhuma query (sem cookie, a biblioteca nem vai ao banco) |
| `requireUser()` como Visitante | 307 → `/entrar` |
| `requireUser()` logado | 200 |
| `requireAdmin()` como Visitante | 404, nenhuma linha de log |
| `requireAdmin()` como Cliente | 404 + `[auth] requireAdmin recusou o usuário <id>` |
| Client Component importando `@/server/session` | build quebra no `server-only` |

O usuário de teste (`dev-05@example.test`) foi apagado depois; sessões e conta foram junto
pelo `onDelete: Cascade`. `/entrar` ainda não existe (ticket 08), então o redirect cai no
404 por enquanto.
