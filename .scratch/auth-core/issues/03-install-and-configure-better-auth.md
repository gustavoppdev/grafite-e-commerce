# 03 - Instalar e configurar o better-auth

Status: resolved
Responsável: Claude
Blocked by: 01

## O que

Exemplo trabalhado: a fiação da biblioteca. Tudo que as outras tarefas consomem nasce aqui.

- `pnpm add better-auth` (conferir a versão instalada e a doc **dela**, não a de memória).
- `src/server/auth.ts` (`server-only`): instância única com `prismaAdapter(prisma, { provider: "postgresql" })`,
  `secret`/`baseURL` vindos de `@/server/env`, `trustedOrigins`, `emailAndPassword`
  (limites de senha da spec, **`autoSignIn: false`** e `customSyntheticUser` — ver abaixo),
  `session` (`expiresIn`, `updateAge`, `cookieCache` desligado
  **com o motivo no comentário**), plugins `admin({ defaultRole: "user", adminRoles: ["admin"] })`
  e `nextCookies()` — este **último da lista**, porque ele age depois dos outros.
- `src/app/api/auth/[...all]/route.ts` com `toNextJsHandler(auth)`.
- `src/features/auth/auth-client.ts`: `createAuthClient` para os formulários dos tickets 08 e 09.
- **`customSyntheticUser`**: `autoSignIn: false` liga a resposta genérica do better-auth
  para e-mail duplicado (200 + usuário sintético + `token: null`), mas a resposta sintética
  padrão só tem os campos do núcleo — e o plugin admin adiciona `role`, `banned`,
  `banReason` e `banExpires`. Sem `customSyntheticUser`, **a resposta falsa é distinguível
  da verdadeira pelo conjunto de chaves e a proteção é cosmética**. Montar o usuário falso
  com os campos do plugin, na ordem núcleo → plugin → adicionais → `id` (o `id` por último,
  para casar com a ordem que o banco devolve). Comentário explicando que é isso que faz a
  proteção existir.
- `hooks: { before: createAuthMiddleware(...) }` em `src/server/auth.ts`: roda o schema do
  ticket 06 no **servidor** para `/sign-up/email`, recusando com
  `APIError("BAD_REQUEST", ...)`. É a camada 3 da tabela de validação da spec.
  Antes de escrever, **descobrir e registrar** o que o better-auth já valida sozinho no
  servidor (formato de e-mail? `name` vazio? tamanho de `name`?) — olhando os tipos e os
  schemas do endpoint em `node_modules/better-auth`, não por suposição. O hook cobre o que
  ficou descoberto; duplicar o que a biblioteca já faz é ruído.
- `docs/adr/0005-auth-goes-through-the-better-auth-client.md`: por que cadastro e login vão
  pelo cliente HTTP e não por server action (o rate limit é no roteador HTTP), com as três
  alternativas e o custo de cada uma.

Comentários em pt-BR explicando o **porquê**: por que `cookieCache` desligado, por que
`SameSite=Lax` e não `Strict`, por que `trustedOrigins` é a defesa de CSRF, por que `role`
nunca vem do formulário, por que o ID não é sequencial.

## Critérios de aceite

- [x] `pnpm lint`, `pnpm typecheck` e `pnpm build` passam.
- [x] `curl -i localhost:3000/api/auth/get-session` responde 200 sem cookie (sem sessão,
      sem consulta ao banco). Verificação completa depende das tabelas (ticket 04).
- [x] Nenhum import de `src/server/auth.ts` fora do servidor; `auth-client.ts` **não**
      importa nada de `src/server/`.
- [x] `curl -X POST /api/auth/sign-up/email` com `name` vazio (ou com 5 mil caracteres) é
      recusado **pelo servidor**, sem passar pelo formulário.
- [x] **Verificado com `curl`**: cadastro com e-mail novo e cadastro com e-mail já
      existente devolvem o mesmo status (200), o mesmo conjunto de chaves na mesma ordem e
      `token: null` nos dois. Diferença no `id`/`createdAt` é esperada; chave a mais ou a
      menos, não. Comparar as duas respostas lado a lado e registrar o resultado.
- [x] Está registrado nos comentários o que a biblioteca valida sozinha e o que o hook
      acrescentou.
- [x] ADR 0005 escrita.

## Notas

- O `auth-client.ts` mora em `src/features/auth/` e não em `src/lib/`: `lib/` é para código
  puro sem I/O, e o cliente faz requisição.
- Sem `adminClient()` no cliente por enquanto: as chamadas de admin são da Feature 10.

## Comments

### 2026-09-28 — Claude: config escrita, verificação bloqueada pelo 04

Feito: `src/server/auth.ts`, `src/app/api/auth/[...all]/route.ts`,
`src/features/auth/auth-client.ts` e a ADR 0005. Instalado **better-auth 1.7.6** (a spec
foi verificada na 1.7.5).

**O que ainda falta para fechar, e por quê:**

- **Todos os critérios com `curl` dependem do ticket 04.** A 1.7.6 compara o schema do
  Prisma com o dela na inicialização e responde **500 `SCHEMA_MISMATCH`** em qualquer rota
  enquanto os models `user`, `session`, `account` e `verification` não existem, inclusive
  no `get-session` sem cookie. Verificar os três critérios de `curl` depois do 04.
- **A validação de `name` no hook depende do ticket 06** (Gustavo). O hook já existe e
  recusa `image` (ver abaixo); o `signUpSchema` entra no lugar marcado quando o 06 for
  resolvido, e aí vem o `curl` com `name` vazio ou de 5 mil caracteres.

**Descobertas no código da 1.7.6, diferentes do que a spec diz:**

1. **O usuário sintético padrão já tem as chaves do plugin admin, e na ordem certa.**
   `buildSyntheticUserOutput` percorre o schema inteiro (núcleo → adicionais → plugins) e
   põe o `id` no fim, a mesma ordem do `transformOutput` do adapter. O que vaza é o
   **valor**: `role` não tem `defaultValue` no schema do plugin (quem grava `"user"` é um
   hook de banco que não roda para usuário falso), então a resposta falsa sai com
   `"role": null` e a verdadeira com `"role": "user"`. O `customSyntheticUser` continua
   obrigatório, mas por causa do valor e não das chaves. A ordem das chaves dentro dele é
   irrelevante, porque o better-auth reordena pelo schema.
2. **`image` também está descoberto.** O endpoint aceita qualquer string em `image` e
   grava. A loja não tem foto de perfil, então o hook recusa o campo.
3. **`role` no corpo é recusado pela própria biblioteca** (`input: false` → 400
   `FIELD_NOT_ALLOWED`). Chaves fora do schema são descartadas.
4. **A origem do `baseURL` já entra em `trustedOrigins` sozinha**
   (`context/helpers.mjs`). A lista explícita fica como documentação e ponto de extensão.
5. **O hook também roda em `auth.api.*`**, não só no roteador HTTP (`api/dispatch.mjs`).
   Então a camada 3 cobre qualquer chamada vinda do servidor.

### 2026-09-28 — Claude: verificação com `curl` (depois do 04)

| Requisição | Resultado |
|---|---|
| `GET /get-session` sem cookie | 200, `null`, `cache-control: no-store` |
| cadastro com `image` no corpo | 400 `image is not accepted on sign-up` (hook) |
| cadastro com `"role": "admin"` | 400 `FIELD_NOT_ALLOWED` (biblioteca) |
| cadastro vindo de `Origin: https://evil.test` | 403 `INVALID_ORIGIN` |
| cadastro com e-mail novo | 200, `token: null`, `role: "user"` |
| cadastro com o mesmo e-mail, outra senha | 200, `token: null`, `role: "user"` |

As duas últimas respostas têm as mesmas chaves na mesma ordem:
`[token, user]` e `[name, email, emailVerified, image, createdAt, updatedAt, role, banned,
banReason, banExpires, id]`. Diferem só em `id`, `createdAt` e `updatedAt`.

**Prova contrária:** sem o `customSyntheticUser`, o cadastro duplicado respondeu
`"role": null`, contra `"role": "user"` do real. A enumeração volta, exatamente como
previsto na descoberta 1 acima.

Falta só o critério do `name`, que espera o `signUpSchema` do ticket 06.

### 2026-10-01 — Claude: `signUpSchema` no hook, ticket fechado

O hook agora roda o `signUpSchema` (ticket 06) no `/sign-up/email` e devolve o corpo
**normalizado** (`return { context: { body } }`): o endpoint grava o nome sem espaços nas
pontas e o e-mail sem espaços e em minúsculas. Sem isso, o hook validaria `" Ana "` e o
banco guardaria `" Ana "` do mesmo jeito.

A recusa diz **quais** campos falharam (`code: "INVALID_SIGN_UP_FIELDS"`), nunca repete os
valores. Roda o schema inteiro, não só o `name`: uma regra, um lugar. `email` e `password`
continuam validados também pela biblioteca, logo depois.

Verificado com `curl`, direto na API:

| Corpo | Resultado |
|---|---|
| `name` vazio | 400 `invalid sign-up fields: name` |
| `name` só com espaços | 400, idem |
| `name` com 5 mil caracteres | 400, idem |
| `name` com `\r\n` (injeção de cabeçalho) | 400, idem |
| sem `name` | 400, idem |
| `{}` | 400 `invalid sign-up fields: name, email, password` |
| `"  Ana Teste  "` + `"  Dev-03B@Example.TEST "` | 200, gravado `"Ana Teste"` / `dev-03b@example.test` |
| `image` no corpo | 400 (hook, como antes) |
| `"role": "admin"` | 400 `FIELD_NOT_ALLOWED` (biblioteca, como antes) |

A paridade contra enumeração foi reconferida com o hook novo: cadastro novo e cadastro
repetido (este com o e-mail em maiúsculas e com espaços) devolvem as mesmas chaves, na mesma
ordem, `token: null` e `role: "user"`. Usuários de teste apagados.
