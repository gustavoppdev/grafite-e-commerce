# 04 - Tabelas de auth: schema e primeira migration

Status: resolved
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

- [x] Migration criada em `prisma/migrations/`, aplicada, e o SQL foi **lido** antes de rodar.
- [x] As quatro tabelas existem no Supabase.
- [x] `pnpm db:generate`, `pnpm typecheck` e `pnpm build` passam.
- [x] `curl localhost:3000/api/auth/get-session` responde sem erro de tabela inexistente.
- [x] A migration é reprodutível do zero (`migrate reset` em ambiente de desenvolvimento).

## Risco principal

`npx auth generate` importa `src/server/auth.ts`, que começa com `import "server-only"` —
e esse pacote **lança erro** fora da condição `react-server`. Ordem de tentativa:

1. `npx auth generate --config src/server/auth.ts` direto (talvez a CLI já resolva).
2. Rodar sob `node --conditions=react-server`.
3. Escrever os models à mão a partir do schema documentado do better-auth + plugin admin.

Registrar nos comentários **qual** funcionou e por quê — o ticket 14 vai bater no mesmo
problema com `create-admin`, e a resposta daqui é a pista de lá.

## Comments

### 2026-09-28 — Claude

**Como o schema foi gerado (pista para o ticket 14).** Das três tentativas do risco:

1. `auth generate --config src/server/auth.ts`: **falha**. A CLI (pacote `auth` 1.7.6)
   detecta o `server-only` e pede para removê-lo.
2. `NODE_OPTIONS=--conditions=react-server`: **falha**. A CLI carrega o config com o
   `jiti`, que tem resolvedor próprio e ignora a condição do Node.
3. Não foi preciso escrever à mão. Funcionou uma **quarta via**: um config descartável só
   para a CLI (`betterAuth({ emailAndPassword: { enabled: true }, plugins: [admin()] })`),
   gerado com `--adapter prisma --dialect postgresql` e apagado em seguida. O schema depende
   só das opções que mudam tabela (plugins, `emailAndPassword`), não do segredo nem do
   banco. Para o ticket 14: o `create-admin` precisa de banco de verdade, então esse truque
   não serve lá; o script próprio com `PrismaClient` continua sendo o caminho.

**Duas migrations, não uma:**

- `auth_tables`: as quatro tabelas, mais `ENABLE ROW LEVEL SECURITY` escrito à mão.
- `lock_down_data_api`: conferindo o banco depois da primeira, `anon` e `authenticated`
  tinham **todos** os privilégios nas quatro tabelas e na `_prisma_migrations` (inclusive
  `TRUNCATE`, que ignora RLS). A causa é um `DEFAULT PRIVILEGES` do Supabase. A migration
  revoga tudo e muda o padrão para as próximas tabelas. Verificado: zero privilégios para
  esses papéis em `public`.

Lição do caminho: a primeira versão da segunda migration ligava RLS na
`_prisma_migrations` e **falhou no shadow database**, onde essa tabela não existe. O banco
real não foi tocado (`migrate status` confirmou). E uma migration **já aplicada** não pode
ser editada, nem num comentário: o Prisma guarda o checksum.

**`migrate dev` × `migrate deploy`:**

- `migrate dev` é de desenvolvimento: compara o `schema.prisma` com as migrations, **gera**
  o arquivo novo, testa tudo num shadow database, aplica e roda o `generate`. Pode pedir
  para resetar o banco se detectar divergência. Nunca em produção.
- `migrate deploy` só **aplica** as migrations que existem e ainda não rodaram, em ordem.
  Não gera nada, não usa shadow database, não reseta nada. É o de produção.
- Na Vercel: o build **não** roda migration, porque a `DIRECT_URL` fica de fora da Vercel
  de propósito (privilégio mínimo, ver `env.schema.ts`). A migration é aplicada de fora
  (da máquina de quem tem a `DIRECT_URL`) **antes** do deploy que depende dela. Ticket 15.

**Atenção: desenvolvimento e produção usam o MESMO projeto Supabase.** O `migrate dev`
acima já alterou o banco que a Vercel usa, e um `migrate reset` apaga os dados de
produção. Hoje não há dado nenhum, então é inofensivo, mas precisa ser resolvido antes de
existir Cliente de verdade (projeto separado para dev). Levar para o ticket 15.

**`migrate reset` (com consentimento explícito do Gustavo; o Prisma 7 bloqueia o comando
quando detecta um agente de IA):** as duas migrations reaplicadas do zero, RLS ligado nas
quatro tabelas, zero privilégios para `anon`/`authenticated`. O reset recria o schema
`public` e leva junto os `DEFAULT PRIVILEGES` do Supabase, então agora tabela nova só
recebe privilégio do dono. A `lock_down_data_api` continua necessária para quem montar o
banco num projeto Supabase novo, que vem com esses padrões.
