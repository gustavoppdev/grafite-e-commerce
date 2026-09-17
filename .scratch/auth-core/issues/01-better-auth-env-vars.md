# 01 - Variáveis de ambiente do better-auth

Status: resolved
Responsável: Claude
Blocked by: -

## O que

Adicionar ao projeto as duas variáveis que o better-auth precisa, validadas como todas as
outras, e preencher o `.env` local.

- `BETTER_AUTH_SECRET` — chave usada para assinar e criptografar. É segredo.
- `BETTER_AUTH_URL` — a URL base da aplicação (`http://localhost:3000` no local).

Arquivos: `src/config/env.schema.ts` e `.env.example` (versionado, sem valor real) e o seu
`.env` (não versionado).

## Critérios de aceite

- [ ] `pnpm dev` com uma das duas faltando falha na hora, dizendo **qual** variável e **por quê**.
- [ ] `BETTER_AUTH_SECRET` curta é recusada pela validação.
- [ ] `.env.example` tem as duas com comentário explicando o que são e como gerar a secret,
      e **nenhum valor real**.
- [ ] `pnpm typecheck` e `pnpm lint` passam.

## Reatribuído

Nasceu como `Responsável: Gustavo` por uma leitura errada minha: parecia "mais duas
variáveis no schema que já existe", padrão repetido. Não era. O ticket carrega um padrão
**novo** no projeto — regra de validação que olha **dois campos ao mesmo tempo** — e pela
regra do projeto a primeira ocorrência de padrão novo é exemplo trabalhado. O exercício
desse mesmo padrão passa a ser o ticket 06 (`confirmPassword`), agora com referência para
olhar. O guia abaixo fica como está, porque é o roteiro de estudo do que foi feito.

## Guia

- **Onde se inspirar:** `src/config/env.schema.ts` inteiro. Já tem o `postgresUrl`
  construído com mensagem customizada e o `parseServerEnv` que imprime qual variável falhou.
  Você só acrescenta duas entradas no `serverEnvSchema` — o resto funciona de graça.

- **Gerando a secret:** `openssl rand -base64 32` (ou `npx auth secret`). Gere agora e
  guarde, porque você vai precisar dela de novo no ticket 15 (Vercel), e **ela não pode ser
  a mesma** em dois ambientes diferentes? Pense: o que essa chave assina, e o que acontece se
  produção e desenvolvimento usarem a mesma e a sua máquina for comprometida?

- **Tamanho mínimo:** a secret assina o cookie de sessão. Se ela for curta, um atacante pode
  quebrá-la por força bruta e **forjar um cookie de sessão válido para qualquer usuário** —
  autenticação inteira derrubada sem precisar de senha de ninguém. `openssl rand -base64 32`
  gera 44 caracteres. Que mínimo você exige no Zod, e por quê esse número?

- **Nem toda variável é segredo:** a `BETTER_AUTH_URL` não é. Mas repare no comentário no
  topo do `env.schema.ts` sobre `NEXT_PUBLIC_`: mesmo não sendo segredo, ela **não** leva
  esse prefixo. Por quê ela não precisa chegar ao navegador? (Dica: quem monta a URL das
  requisições do `authClient` — o servidor, no HTML que ele manda, ou o navegador, a partir
  da página onde já está?)

- **Validar o formato da URL:** o `postgresUrl` no arquivo mostra o padrão —
  `z.url({ protocol: ... })` com mensagem própria. Aqui o protocolo aceito é `http` ou
  `https`. Cuidado com um detalhe: `z.url()` aceita barra no final, e
  `http://localhost:3000/` com barra pode gerar `//api/auth` na concatenação. Vale recusar
  barra final na validação em vez de descobrir isso depois.

- **Extra, se quiser ir além:** exigir `https` quando `NODE_ENV === "production"`. Um
  `BETTER_AUTH_URL` em `http` na produção faria o cookie de sessão trafegar em texto puro.
  Isso não é uma regra por campo, é uma regra que olha dois campos juntos — no Zod isso é um
  `.refine()`/`.superRefine()` **no objeto**, não no campo. Repare que o `failValidation` em
  `src/lib/action-result.ts` comenta exatamente esse caso: issue sem `path` é do objeto
  inteiro. Aqui o consumidor é o `parseServerEnv`, então confira como a mensagem aparece.

- **Pitfall:** o `next.config.ts` chama `parseServerEnv(process.env)` ao iniciar. Se você
  errar o schema, a falha aparece antes de qualquer página — é o comportamento certo, não
  um bug. Leia a mensagem inteira antes de mexer.

## Comments

## Comments

Feito por Claude depois de reatribuído (ver acima). Gustavo chegou até os dois schemas de
campo; o que travou foi onde colocar a regra de produção.

**A regra de https mora num `.superRefine` no objeto, não no campo.** Um schema de campo
enxerga só o próprio valor, e decidir se https é obrigatório exige o `NODE_ENV` **validado**
— que só existe depois do `z.object({...})` inteiro ser parseado.

A tentativa anterior lia `process.env.NODE_ENV` numa constante no topo do arquivo. Quebra de
três jeitos, e vale registrar os três porque só o primeiro dá erro visível: lê fonte
diferente da que `parseServerEnv` recebe por argumento (função deixa de ser pura e a regra
fica impossível de testar); é avaliada uma vez, no import, e não a cada parse; e não enxerga
o `.default("development")` do schema, então com `NODE_ENV` ausente o schema conclui
"development" e a constante conclui "production" — duas respostas no mesmo parse.

**`NODE_ENV === "production"` não significa "rodando em produção".** Significa "compilado em
modo produção", e `pnpm build`/`pnpm typecheck` na máquina de quem desenvolve também rodam
assim. A primeira versão da regra quebrou o `typecheck` local, com o `.env` correto apontando
para `http://localhost:3000`. Daí a segunda condição: http é aceito quando o host é
`localhost`/`127.0.0.1`/`[::1]`, onde não há rede para escutar. O nome da variável promete um
sinal que ela não entrega.

**O regex do segredo foi trocado por um mínimo.** A versão anterior (`length(44)` +
`/^[A-Za-z0-9+/]{43}=$/`) era a impressão digital exata de `openssl rand -base64 32`: recusava
base64url (que várias ferramentas emitem, sem `=` e com `-_`), recusava uma chave de 64 bytes
— mais forte — e aceitava 43 letras `A` seguidas de `=`, que tem entropia zero. Nenhum regex
mede entropia. O que a validação consegue ser é um **piso** contra o erro bobo, e piso é
`min`, não tamanho exato nem alfabeto. Há teste garantindo que base64url e hex passam.

**Mensagens** em minúscula e como fragmento, porque o `parseServerEnv` as renderiza como
`  - VARIÁVEL: mensagem`. O `path: ["BETTER_AUTH_URL"]` no `addIssue` existe por isso: sem
ele a issue é do objeto e a linha sairia `  - : mensagem`, sem dizer o que arrumar.

**Testes** em `src/config/env.schema.test.ts`, os primeiros do projeto a cobrir o env.
Nenhum encosta no `process.env` — é isso que prova que a regra está no lugar certo. Suíte
verificada por sabotagem: tirar a exceção de localhost derruba 1, trocar `min(32)` por
`min(1)` derruba 1, desligar a regra de produção derruba 1.

Verificado: `pnpm lint`, `pnpm typecheck`, `pnpm test` (18) e `pnpm build` passam.
