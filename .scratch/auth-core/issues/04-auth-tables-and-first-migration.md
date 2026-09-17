# 04 - Tabelas de auth: schema e primeira migration

Status: open
Responsável: Claude
Blocked by: 03

## O que

Exemplo trabalhado: a primeira migration do projeto (a Fundação não tinha nenhum model).

- Gerar/escrever os models do better-auth em `prisma/schema.prisma`: `User`, `Session`,
  `Account`, `Verification`, mais os campos do plugin admin (`role`, `banned`, `banReason`,
  `banExpires` em `User`; `impersonatedBy` em `Session`).
- Revisar o que veio: `@unique` no e-mail, `onDelete: Cascade` de `Session`/`Account` para
  `User`, índices nos campos consultados (`token` da sessão, `userId`), nomes em
  `camelCase` com `@@map`/`@map` se o gerado divergir do resto do projeto.
- Criar e aplicar a primeira migration (`pnpm db:migrate`), conferir as tabelas no Supabase.
- Registrar no ticket a diferença entre `migrate dev` (local, gera o arquivo) e
  `migrate deploy` (aplica o que existe, é o que roda em produção) e como a Vercel se encaixa.

## Critérios de aceite

- [ ] Migration criada em `prisma/migrations/`, aplicada, e o SQL foi **lido** antes de rodar.
- [ ] As quatro tabelas existem no Supabase.
- [ ] `pnpm db:generate`, `pnpm typecheck` e `pnpm build` passam.
- [ ] `curl localhost:3000/api/auth/get-session` responde sem erro de tabela inexistente.
- [ ] A migration é reprodutível do zero (`migrate reset` em ambiente de desenvolvimento).

## Risco principal

`npx auth generate` importa `src/server/auth.ts`, que começa com `import "server-only"` —
e esse pacote **lança erro** fora da condição `react-server`. Ordem de tentativa:

1. `npx auth generate --config src/server/auth.ts` direto (talvez a CLI já resolva).
2. Rodar sob `node --conditions=react-server`.
3. Escrever os models à mão a partir do schema documentado do better-auth + plugin admin.

Registrar nos comentários **qual** funcionou e por quê — o ticket 14 vai bater no mesmo
problema com `create-admin`, e a resposta daqui é a pista de lá.

## Comments
