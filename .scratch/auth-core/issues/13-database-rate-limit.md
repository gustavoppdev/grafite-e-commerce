# 13 - Rate limit no banco, mais rígido nas rotas sensíveis

Status: open
Responsável: Gustavo
Blocked by: 04

## O que

Tirar o rate limit da memória e colocar no banco — e decidir, com número na mão, se os
limites que já existem são os que a gente quer.

- Model do Prisma para a tabela de rate limit + migration (segunda migration do projeto;
  a primeira, do ticket 04, é o exemplo).
- `rateLimit` no `src/server/auth.ts`: `enabled` (inclusive em desenvolvimento),
  `storage: "database"`, e `customRules` **só se** você concluir que os padrões não servem.
- Verificar na mão que o 429 acontece e que o contador está mesmo na tabela.

**Leia antes de começar, porque muda o ticket:** apurado no código da v1.7.5, o better-auth
**já** aplica regras especiais embutidas de **3 requisições por 10s** em `/sign-in*`,
`/sign-up*`, `/change-password*` e `/change-email*`. O padrão global é 10s/100 (a doc diz
60s — o código manda). Ou seja, as rotas sensíveis **não estão soltas**. O trabalho de valor
aqui é o **armazenamento**; `customRules` virou uma decisão a justificar, não uma correção
a fazer.

## Critérios de aceite

- [ ] A tabela existe, a migration foi lida antes de aplicar, e as linhas aparecem lá
      quando você bate no endpoint (conferir no Supabase ou no `db:studio`).
- [ ] Repetir `POST /api/auth/sign-in/email` devolve **429**, e o número de tentativas
      permitidas é o que você espera (contar, não estimar). O header é `X-Retry-After`.
- [ ] Depois da janela, volta a aceitar.
- [ ] O limite global (mais folgado) continua valendo nas outras rotas de `/api/auth`.
- [ ] Está registrado se você manteve 3/10s ou trocou, **com a conta que justifica**.
- [ ] Navegar normalmente na loja **não** dispara 429.
- [ ] `pnpm lint`, `pnpm typecheck` e `pnpm build` passam.

## Guia

### O ataque que isso previne

**Força bruta e credential stuffing.** Sem limite, o formulário de login aceita quantas
tentativas o atacante quiser: ou ele testa milhares de senhas numa conta, ou — o caso mais
comum hoje — pega uma lista de e-mail+senha vazada de outro site e testa todas na nossa
loja, porque muita gente repete senha. Também é o que freia a enumeração de contas do
ticket 07: mensagem genérica não serve para nada se dá para testar 10 mil e-mails por minuto.

### Como abordar

- **Onde se inspirar:** o ticket 04 é o exemplo da migration (leia os comentários que
  ficaram nele). O `src/server/auth.ts` (ticket 03) é onde a config entra, e os comentários
  de lá mostram o tom.

- **Descubra o schema da tabela na doc, não por tentativa.** O better-auth diz quais campos
  a tabela de rate limit precisa (`storage: "database"` na seção de rate limit da doc da
  **versão instalada**) e aceita `modelName` se você quiser outro nome. Se os nomes das
  colunas não baterem exatamente, o erro vai aparecer em runtime, na primeira requisição.
  Confira também se a CLI (`auth generate`) gera esse model — e lembre do risco do
  `server-only` registrado no ticket 04.

- **Padrão perigoso: `enabled` é `isProduction` por default.** Se você não ligar
  explicitamente, o rate limit **não roda em desenvolvimento** — você testa, passa, e a
  primeira vez que o código roda de verdade é em produção. Ligue e teste localmente.

- **Por que no banco e não em memória (o padrão):** está na spec, mas vale você reproduzir o
  raciocínio antes de ler: na Vercel, duas requisições suas podem cair em duas instâncias
  diferentes, e uma instância nova nasce com o contador zerado. O que "5 tentativas por
  minuto" significa nesse mundo, se o contador está na memória de cada instância?

- **Escolher os números é a parte difícil, e agora a pergunta é se você concorda com os
  deles.** 3 por 10s dá 18 por minuto, 1080 por hora, por IP e por rota. Pense nos dois
  cenários e veja se o número serve:
  1. Uma pessoa que esqueceu a senha erra 3, 4, 5 vezes seguidas — rápido, porque está
     tentando variações da mesma senha. Com 3/10s, na quarta tentativa ela toma 429. Isso é
     aceitável ou você acabou de criar um jeito de irritar cliente legítimo? Uma janela
     maior com teto maior (ex. 10 por 60s) atende os dois lados melhor, ou pior?
  2. Um atacante com uma lista de 10 mil senhas: 1080/hora dá pouco mais de 9 horas por IP.
     Muda de "minutos" para "horas" — o suficiente? E se ele tiver 100 IPs?

  O cenário 2 expõe o limite estrutural: a chave é `${ip}|${path}` e **não dá para contar
  por e-mail** com `customRules` (elas só trocam janela e máximo). Registre isso como o que
  o rate limit **não** resolve; quem resolve é a Feature 2 (Turnstile e senha vazada).

- **Janela fixa, e o efeito de borda:** confirme como o better-auth conta. Numa janela fixa
  de 10s, quem tenta no segundo 9 e no segundo 11 faz o dobro do limite em dois segundos.
  Aceitável aqui? Saiba **que** é assim e por que aceita.

- **Janela deslizante ou fixa?** Confira qual o better-auth implementa. Numa janela fixa de
  60s, quem tenta no segundo 59 e no segundo 61 faz o dobro do limite em dois segundos. Isso
  é aceitável aqui? (Provavelmente sim — mas saiba **que** é assim, e por que aceita.)

- **Testando:** um `for` com `curl` no `/api/auth/sign-in/email` resolve. Use e-mail e senha
  inválidos de propósito. Repare em duas coisas: o status muda de 401 para 429, e o corpo /
  header dizem quando tentar de novo. Confirme também que o contador está mesmo indo para a
  **tabela** — se você configurar errado, o better-auth cai para memória e o teste passa do
  mesmo jeito localmente, e só quebra na Vercel. (Como você comprova, sem confiar no config?)

- **Pitfall 1:** o limite é por IP, e em desenvolvimento seu IP é sempre o mesmo — fácil de
  se bloquear sozinho durante os tickets 08 e 09. Saiba como limpar (apagar as linhas da
  tabela) antes de precisar.

- **Pitfall 2:** o rate limit vale para o que passa pelo roteador HTTP do better-auth. É
  exatamente por isso que cadastro e login vão pelo `authClient` nesta feature e não por
  server action (ver "Por onde o formulário fala com o better-auth" na spec). Ao configurar,
  confirme que o caminho que a **nossa tela** usa é o caminho que você limitou — não confie,
  verifique batendo pela tela e olhando a tabela.

- **Pitfall 3:** se `customStorage` estiver configurado, ele ganha de `storage: "database"`
  silenciosamente. Não configure os dois.

- **Honestidade no comentário:** rate limit por IP é atrito, não barreira. IP é compartilhado
  (operadora, NAT) e trocável (proxy residencial, botnet). Registre o que ele não resolve;
  quem resolve o resto é a Feature 2 (Turnstile e senha vazada).

## Comments
