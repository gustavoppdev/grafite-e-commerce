# 14 - Primeiro Admin

Status: resolved
Responsável: Claude
Blocked by: 04, 09

## O que

Um jeito repetível de criar (ou promover) o primeiro Administrador **fora da interface**, e o
seu Admin criado no banco.

**Decisão já fechada (ver spec): promover, não criar.** Você se cadastra por `/cadastro`
como um Cliente qualquer e o script só troca o `role` para `"admin"`. O script nunca toca em
senha, é muito menos código, e promover é a operação que a Feature 10 vai precisar de
qualquer forma — criar usuário do nada seria um caminho usado uma vez na vida do projeto.

Por que não pode ser uma tela: ela teria que funcionar **sem** sessão de Admin (senão
ninguém a usaria da primeira vez), ou seja, seria uma rota pública que cria superusuário.
Quem achasse a URL antes de nós viraria dono da loja. "Só funciona se não houver Admin"
vira corrida entre o deploy e o primeiro acesso; "protegida por senha no `.env`" é só uma
segunda senha, sem rate limit e sem hash. Criar Admin é tarefa de operador.

## Critérios de aceite

- [x] Existe um comando documentado que promove um Admin, e ele funcionou:
      `pnpm admin:promote <email>`.
- [ ] O seu usuário existe no banco com `role: "admin"` e você consegue abrir `/admin`.
      **Gustavo roda** (é a conta dele e a confirmação é interativa).
- [x] O caminho escolhido **não** é alcançável por HTTP: não é rota, não é server action.
- [x] Rodar duas vezes não estraga nada (idempotente ou falha com mensagem clara).
- [x] Nenhuma senha em texto puro ficou em arquivo versionado nem no histórico do shell.

## Comments

### 2026-10-02 — Claude

**O que mudou:** `scripts/promote-admin.ts` + `pnpm admin:promote`, `tsx` como
devDependency, `toRole` movido de `src/server/session.ts` para `src/lib/roles.ts` (com
teste), e a pasta `scripts/` registrada em `docs/structure.md`.

**O que foi tentado, e o erro de cada um:**

1. **CLI oficial, `auth create-admin` (1.7.6):** descartada sem rodar, pelas opções do
   `--help`. Ela **cria** a conta (não promove), recebe a senha por `--password` (vai para o
   histórico do shell e aparece no `ps`), recusa quando já existem usuários sem `--force` e
   importa o nosso `auth.ts`, que tem `server-only` e já barrou a CLI no ticket 04.
2. **Node puro com TypeScript** (`node scripts/x.ts`, o Node 26 remove tipos sozinho):
   falha com `ERR_MODULE_NOT_FOUND`. O client gerado do Prisma importa `./enums` **sem
   extensão**, e o Node exige a extensão. Também não entende o alias `@/`.
3. **`tsx`:** funciona. Resolve imports sem extensão e lê os `paths` do `tsconfig.json`,
   então o script usa `@/generated/prisma/client` e `@/lib/roles` como o resto do código.
   O pnpm pediu decisão sobre o postinstall do `esbuild` (dependência do `tsx`):
   **negado** em `pnpm-workspace.yaml`. O binário da plataforma já vem como dependência
   opcional e o `tsx` roda sem o script; código de terceiro rodando na instalação só com
   motivo.

**Decisões do script:**

- **Não importa `src/server/`.** `server-only` é proteção de bundle do Next; o script é
  outro processo e o import lançaria erro. Ele monta a própria conexão repetindo as
  garantias do `db.ts`: TLS validado com a CA do Supabase e timeout de conexão.
- **`DIRECT_URL`, não `DATABASE_URL`.** Promover é tarefa de operador, como migration, e
  usa a credencial que só existe na máquina do operador (fora da Vercel de propósito). Ter
  a `DIRECT_URL` é o que separa quem pode promover de quem não pode.
- **Só dá o papel `"admin"`.** Não aceita papel por argumento: um script que grava qualquer
  `role` é seguro só por estar no terminal certo, então ele faz uma coisa só.
- **Confirmação:** mostra nome, e-mail e papel atual e pede o e-mail digitado de novo. É
  contra erro de digitação, não contra atacante (quem roda já tem o banco).
- **E-mail em minúsculas** antes de buscar: o better-auth grava assim.
- **Conta bloqueada é recusada:** daria um Admin que não consegue entrar.
- **Termina listando todos os Admins**, para um Admin inesperado saltar aos olhos.
- **Erro mostra só a `message`**, nunca o objeto: erro de conexão pode trazer a URL do banco
  com a senha.
- **Sai com código 1** em toda falha, para `&&` não seguir como se tivesse dado certo.
- Vale na próxima requisição, sem sair e entrar: `requireAdmin` lê o papel do banco a cada
  requisição (`cookieCache` desligado, ticket 03).

**`toRole` foi para `src/lib/roles.ts`.** O script precisa decidir "já é Admin?" e não pode
importar `session.ts` (`server-only`). Copiar a regra abriria a chance de os dois
discordarem (o plugin aceita `"user,admin"`), e o script diria "já é Admin" para alguém que
a loja trata como Cliente. Uma regra, um lugar, agora com teste.

**Testado** com um usuário descartável inserido direto no banco (`promote-test@exemplo.com`,
apagado no fim):

| Caso | Resultado |
|---|---|
| Sem argumento | `Uso: pnpm admin:promote <email>`, saída 1 |
| E-mail inexistente | manda cadastrar em `/cadastro` primeiro, saída 1 |
| Confirmação errada | `E-mail diferente. Nada foi alterado.`, saída 1 |
| Confirmação certa, argumento em MAIÚSCULAS | promovido, lista com 1 Admin |
| Rodar de novo | `já é Admin. Nada a fazer.`, saída 0, nada gravado |
| Conta bloqueada | recusada, saída 1 |

**Falta:** Gustavo rodar para a conta dele (`gustavopp.dev@gmail.com`, hoje `role: user`)
e abrir `/admin`. Em produção é o mesmo banco (ver ticket 04), então isso já vale para o
ticket 15.
