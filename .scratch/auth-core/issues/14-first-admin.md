# 14 - Primeiro Admin

Status: open
Responsável: ~~Gustavo~~ Claude
Blocked by: 04, 09

## O que

Um jeito repetível de criar (ou promover) o primeiro Administrador **fora da interface**, e o
seu Admin criado no banco.

**Decisão já fechada (ver spec): promover, não criar.** Você se cadastra por `/cadastro`
como um Cliente qualquer e o script só troca o `role` para `"admin"`. O script nunca toca em
senha, é muito menos código, e promover é a operação que a Feature 10 vai precisar de
qualquer forma — criar usuário do nada seria um caminho usado uma vez na vida do projeto.

O que fica para você decidir é o **como**: a CLI oficial (`npx auth@latest create-admin`,
que cria em vez de promover, e por isso provavelmente não serve) ou um script nosso em
`scripts/`, rodado por um comando no `package.json`. Escolha com base no que **funciona** e
registre o que você tentou.

## Critérios de aceite

- [ ] Existe um comando documentado (no `package.json` e/ou nos comentários deste ticket)
      que cria ou promove um Admin, e ele funcionou.
- [ ] O seu usuário existe no banco com `role: "admin"` e você consegue abrir `/admin`.
- [ ] O caminho escolhido **não** é alcançável por HTTP: não é rota, não é server action.
- [ ] Rodar duas vezes não estraga nada (idempotente ou falha com mensagem clara).
- [ ] Nenhuma senha em texto puro ficou em arquivo versionado nem no histórico do shell
      de um jeito que você não queira.

## Guia

### Por que isso não pode ser uma tela

Se existisse um `/admin/criar-primeiro-admin`, ele teria que estar acessível **sem** sessão
de Admin — senão ninguém conseguiria usar a primeira vez. Ou seja: uma rota pública que cria
um superusuário. Quem descobrisse a URL antes de você viraria dono da loja. Variações que
também não resolvem: "só funciona se não existir nenhum Admin" (corrida entre o deploy e o
primeiro acesso — o atacante só precisa ser mais rápido), ou "protegida por uma senha no
`.env`" (que é só uma segunda senha, agora sem rate limit e sem hash).

Criação de superusuário é operação de **operador**, com acesso ao servidor ou ao banco, não
de visitante. É por isso que quase todo framework faz isso por CLI.

A mesma lógica explica uma decisão do ticket 03: `role` nunca vem do corpo da requisição de
cadastro. Se viesse, o formulário público de cadastro **seria** a tela que acabamos de
descartar.

### O problema que você vai encontrar

`src/server/auth.ts` e `src/server/db.ts` começam com `import "server-only"`. Esse pacote
**lança um erro** quando é importado fora da condição `react-server` — e um processo Node
comum (a CLI do better-auth, um `tsx script.ts`) não está nessa condição. Confirme você
mesmo: `cat node_modules/server-only/index.js`.

Saídas, e o que cada uma custa:

- **Rodar sob a condição:** `node --conditions=react-server ...`. Funciona se a ferramenta
  respeitar as condições do Node na hora de resolver os imports. Teste; pode não respeitar.
- **Script que não importa `src/server/`:** abre o próprio `PrismaClient` e faz o trabalho.
  Repare que isso não é uma gambiarra para furar a regra — é o reconhecimento de que o script
  é **outro processo**, não a aplicação, e o `server-only` é uma proteção de bundle do Next.
  Se você fizer assim, você precisa reproduzir a conexão TLS verificada do `src/server/db.ts`
  (leia os comentários de lá — a CA do Supabase, e por que `rejectUnauthorized: false` está
  proibido). Cuidado também com qual URL usar: pooler ou conexão direta? Reveja por que a
  `DIRECT_URL` não está no `env.schema.ts` e o que isso implica para um script local.
- **Promover em vez de criar:** você se cadastra pela tela (ticket 09), como um Cliente
  qualquer, e o script só troca `role` para `"admin"`. Bem menos código — nada de hash de
  senha, nada de criar registro em `account`. Qual é o custo? (Pense: o que acontece se o
  e-mail que você passar não existir, e o que o script faz nesse caso.)

Escolha **uma**, faça funcionar e escreva nos comentários o que você tentou, o que falhou e
qual foi o erro exato. O ticket 04 bateu no mesmo problema para gerar o schema: comece
olhando o que ficou registrado lá.

### Cuidados

- **Senha no argumento do comando** vai para o histórico do shell e aparece em `ps` para
  qualquer processo da máquina. As duas CLIs sérias perguntam a senha em vez de aceitar por
  flag. Se você escrever o script, prefira perguntar.
- **Confirmação antes de promover**: um script que promove sem confirmar é um script que
  promove a pessoa errada por erro de digitação. Exigir o e-mail exato e mostrar quem vai ser
  promovido antes de gravar custa três linhas.
- **Não crie um segundo caminho de escalada.** Se o script aceita qualquer `role` vinda de
  argumento, ele é seguro só porque está no seu terminal. Está tudo bem — mas registre isso.
- Confira depois, no banco, que só existe **um** Admin e que o campo `banned` do seu usuário
  está como esperado.

## Comments
