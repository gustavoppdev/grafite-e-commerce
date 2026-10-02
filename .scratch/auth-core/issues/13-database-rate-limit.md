# 13 - Rate limit no banco, mais rígido nas rotas sensíveis

Status: resolved
Responsável: Claude
Blocked by: 04

## O que

Tirar o rate limit da memória e colocar no banco — e decidir, com número na mão, se os
limites que já existem são os que a gente quer.

- Model do Prisma para a tabela de rate limit + migration (segunda migration do projeto;
  a primeira, do ticket 04, é o exemplo).
- `rateLimit` no `src/server/auth.ts`: `enabled` (inclusive em desenvolvimento),
  `storage: "database"`, e `customRules` **só se** você concluir que os padrões não servem.
- Verificar na mão que o 429 acontece e que o contador está mesmo na tabela.

O ataque: **força bruta** (milhares de senhas numa conta) e **credential stuffing** (a lista
de e-mail+senha vazada de outro site, testada aqui porque muita gente repete senha). É
também o que dá sentido às mensagens genéricas do ticket 07: sem limite, daria para testar
10 mil e-mails por minuto.

**Leia antes de começar, porque muda o ticket:** apurado no código da v1.7.5, o better-auth
**já** aplica regras especiais embutidas de **3 requisições por 10s** em `/sign-in*`,
`/sign-up*`, `/change-password*` e `/change-email*`. O padrão global é 10s/100 (a doc diz
60s — o código manda). Ou seja, as rotas sensíveis **não estão soltas**. O trabalho de valor
aqui é o **armazenamento**; `customRules` virou uma decisão a justificar, não uma correção
a fazer.

## Critérios de aceite

- [x] A tabela existe, a migration foi lida antes de aplicar, e as linhas aparecem lá
      quando você bate no endpoint.
- [x] Repetir `POST /api/auth/sign-in/email` devolve **429**, e o número de tentativas
      permitidas é o que você espera (contar, não estimar). O header é `X-Retry-After`.
- [x] Depois da janela, volta a aceitar.
- [x] O limite global (mais folgado) continua valendo nas outras rotas de `/api/auth`.
- [x] Está registrado se você manteve 3/10s ou trocou, **com a conta que justifica**.
- [x] Navegar normalmente na loja **não** dispara 429.
- [x] `pnpm lint`, `pnpm typecheck` e `pnpm build` passam.

## Comments

### 2026-10-02 — Claude

**O que mudou:** model `RateLimit` (gerado pela CLI com o mesmo config descartável do
ticket 04, agora com `rateLimit: { storage: "database" }`), a migration `rate_limit` e o
bloco `rateLimit` em `src/server/auth.ts`.

**A migration tem RLS escrito à mão**, como a `auth_tables`. Nesta tabela o ataque é
específico: pela API REST do Supabase, quem tivesse a chave `anon` leria os IPs de quem
tentou entrar e, pior, **apagaria a própria linha para zerar o contador**. Conferido depois
de aplicar: `relrowsecurity = true` e só `postgres` tem privilégio na tabela (os
`DEFAULT PRIVILEGES` da `lock_down_data_api` funcionaram para a tabela nova).

**Correção ao ticket 04:** lá está escrito que o `migrate dev` "roda o `generate`". **No
Prisma 7 não roda mais.** Sintoma: a migration aplicada, a tabela no banco, e toda rota de
auth respondendo 500 com `SCHEMA_MISMATCH: missing-table rateLimit`, porque o better-auth
compara com o client **gerado**, que não tinha o model. Remédio: `pnpm db:generate` depois
de toda migration (e reiniciar o `next dev`).

**Como o better-auth conta (lido em `api/rate-limiter`, v1.7.6):**

- Chave `${ip}|${caminho}`. Linha por chave, com `count` e `lastRequest` (ms).
- A janela começa na **última tentativa aceita**, não num relógio fixo: enquanto as
  tentativas vêm com menos de `window` segundos entre elas, `count` sobe; ao chegar em
  `max`, recusa até passarem `window` segundos da última aceita. Não é janela fixa (não
  existe o efeito de borda "3 no segundo 9 + 3 no segundo 11") nem janela deslizante.
- A tentativa **recusada não grava nada**: o bloqueio não se estica. Visto no teste, o
  `X-Retry-After` desce 10 → 9 → 8 enquanto as recusas continuam.
- O incremento é um UPDATE condicional (`where count < max`), então é atômico.
- Linhas velhas se apagam sozinhas quando algum contador recomeça (corte = a maior janela
  configurada, hoje 60s, de uma regra embutida da Feature 2).

**Testes (`next dev`, contados):**

| Teste | Resultado |
|---|---|
| 6 logins errados seguidos | 401, 401, 401, 429 (`X-Retry-After: 10`), 429 (9), 429 (8) |
| Tabela depois | `0000:…:0000\|/sign-in/email`, `count = 3` (`::1` agrupado pelo prefixo /64) |
| Depois de 10s | 401 de novo, contador recomeça |
| 20 logins **em paralelo** | exatamente 3 × 401 e 17 × 429 |
| 110 `GET /get-session` em paralelo (20 por vez) | exatamente 100 × 200 e 10 × 429 |
| Navegar em `/`, `/entrar`, `/cadastro`, `/conta`, `/admin`, `/design-system` (3× cada) | nenhuma linha na tabela, nenhum 429 |

Navegar não conta porque a sessão das páginas é lida no servidor por `auth.api.getSession`,
que não passa pelo roteador HTTP. Os paralelos são a prova de que o contador é atômico: com
"ler, decidir, gravar" separado, vários passariam por terem lido o mesmo número.

**Como provar que está no banco sem confiar no config:** apagar as linhas, bater no
endpoint e ver a linha aparecer com o `count` certo. Em memória o 429 aconteceria do mesmo
jeito localmente, e só a tabela diferencia os dois.

**Decisão: manter 3 por 10s (regra embutida) no login e no cadastro. Sem `customRules`.**

| | 3 / 10s (mantido) | 10 / 60s (alternativa) |
|---|---|---|
| Teto por IP | 18/min, 1080/h | 10/min, 600/h |
| Lista de 10 mil senhas, 1 IP | ~9,3 h | ~16,7 h |
| Mesma lista, 100 IPs | ~5,6 min | ~10 min |
| Pessoa que erra rápido | 4ª tentativa em <10s espera **até 10s** | quase nunca bloqueia, mas quando bloqueia espera **até 60s** |
| Muita gente atrás do mesmo IP (operadora, NAT) | 18 logins/min sustentados | 10/min: bloqueia antes |

A conta que decide: entre as duas opções a diferença contra o atacante é **menos de 2×**,
enquanto o ataque distribuído (100 IPs) muda o resultado em **100×**. Ou seja, o número
não é onde mora a segurança contra o atacante sério; o que muda isso é a Feature 2
(Turnstile cobra custo por tentativa, independente de IP). Então o critério vira a pessoa
legítima e o IP compartilhado, e a 3/10s ganha nos dois: espera curta e mais vazão
sustentada. De brinde, zero código nosso, e a regra embutida já cobre `/change-password` e
`/change-email`, que chegam na Feature 2. O 429 já tem mensagem em pt-BR desde o ticket 07.

O padrão global (10s / 100) ficou escrito no config com os valores do código: a doc diz
60s, e escrever protege de mudar por baixo numa atualização.

**Achado de segurança: de onde vem o IP.** Lido em `@better-auth/core/utils/ip`: o IP sai
do `x-forwarded-for` e só se ele tiver **um** valor (com vários, o primeiro é o que o
cliente pode ter inventado, e a biblioteca não escolhe). Testado:

- `next dev` **repassa o header do cliente sem mexer**: com `X-Forwarded-For: 203.0.113.7`
  a chave virou `203.0.113.7|/sign-in/email`. Em dev, trocar o header a cada requisição
  escapa do limite.
- Com dois valores, em dev cai em `127.0.0.1`. Em produção cairia em `no-trusted-ip`, uma
  chave só para a loja inteira: 3 logins a cada 10s **para todo mundo**, um jeito de
  derrubar o login.

Em produção a segurança depende de a Vercel sobrescrever o header. A doc dela diz que sim,
mas isso só se prova lá: virou critério de aceite do ticket 15, com o plano B escrito.

**O que o rate limit NÃO resolve** (registrado no comentário do config): a chave é por IP,
e IP é compartilhado e trocável. É atrito, não barreira. Contar por e-mail continua adiado
para a Feature 2 (nota no roadmap), para ser comparado com o Turnstile.

**Para destravar a si mesmo em dev:** `DELETE FROM "rateLimit";` (ou apagar as linhas no
`pnpm db:studio`).
