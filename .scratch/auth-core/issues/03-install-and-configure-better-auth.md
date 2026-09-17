# 03 - Instalar e configurar o better-auth

Status: open
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

- [ ] `pnpm lint`, `pnpm typecheck` e `pnpm build` passam.
- [ ] `curl -i localhost:3000/api/auth/get-session` responde 200 sem cookie (sem sessão,
      sem consulta ao banco). Verificação completa depende das tabelas (ticket 04).
- [ ] Nenhum import de `src/server/auth.ts` fora do servidor; `auth-client.ts` **não**
      importa nada de `src/server/`.
- [ ] `curl -X POST /api/auth/sign-up/email` com `name` vazio (ou com 5 mil caracteres) é
      recusado **pelo servidor**, sem passar pelo formulário.
- [ ] **Verificado com `curl`**: cadastro com e-mail novo e cadastro com e-mail já
      existente devolvem o mesmo status (200), o mesmo conjunto de chaves na mesma ordem e
      `token: null` nos dois. Diferença no `id`/`createdAt` é esperada; chave a mais ou a
      menos, não. Comparar as duas respostas lado a lado e registrar o resultado.
- [ ] Está registrado nos comentários o que a biblioteca valida sozinha e o que o hook
      acrescentou.
- [ ] ADR 0005 escrita.

## Notas

- O `auth-client.ts` mora em `src/features/auth/` e não em `src/lib/`: `lib/` é para código
  puro sem I/O, e o cliente faz requisição.
- Sem `adminClient()` no cliente por enquanto: as chamadas de admin são da Feature 10.

## Comments
