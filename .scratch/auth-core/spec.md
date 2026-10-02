# Feature 1: Auth essencial (`auth-core`)

## Objetivo

Uma pessoa consegue criar conta, entrar e sair. A loja passa a ter duas áreas fechadas —
`/conta` (Cliente) e `/admin` (Administrador) — e uma forma única, no servidor, de exigir
sessão e papel. Tentativa em massa de login é freada por rate limit no banco.

Ao final, na URL da Vercel: `/cadastro` cria um Cliente, `/entrar` autentica, o header
mostra o menu da conta, `/conta` exige sessão, `/admin` só existe para quem é Admin, e o
primeiro Admin foi criado fora da interface.

## Fora do escopo

- **Feature 2 (`auth-hardening`)**: verificação de e-mail, recuperação de senha, senha
  vazada (HIBP), Turnstile, lista de sessões ativas, derrubar sessões ao trocar senha.
- **Feature 10**: banir Cliente, listar usuários, promover Admin pela interface.
- **Feature 7**: `/conta` de verdade (perfil, endereços). Aqui só a casca protegida.
- `/admin` de verdade (catálogo) é a Feature 3. Aqui só a casca protegida.
- Login social (OAuth), 2FA e passkeys: não entram no projeto.
- react-hook-form: continua para a Feature 3, como a Fundação decidiu.

## Decisões

### Biblioteca

better-auth (1.7.x) com `prismaAdapter`, instância única em `src/server/auth.ts`
(`server-only`, como todo arquivo da pasta). Rotas HTTP montadas em
`src/app/api/auth/[...all]/route.ts` com `toNextJsHandler`.

### Por onde o formulário fala com o better-auth

Esta é a decisão que organiza a feature, e ela contraria o padrão do projeto de propósito.

O caminho natural aqui seria server action + Zod + `ActionResult`, como a Fundação
estabeleceu. Mas o rate limit do better-auth é implementado **no roteador HTTP** dele:
chamar `auth.api.signInEmail()` de dentro de uma server action executa o endpoint direto e
**passa por cima do rate limit** ([doc](https://better-auth.com/docs/concepts/rate-limit)).
Um formulário de login sem limite de tentativas é força bruta liberada — o exato ataque que
esta feature tem que fechar.

As quatro saídas possíveis:

| Caminho | Rate limit | Custo |
|---|---|---|
| Server action → `auth.api.*`, sem mais nada | **não vale** | força bruta liberada. Descartado |
| Server action → `auth.api.*` + `rateLimit.customStorage` nosso | vale nos dois caminhos | **nós** escrevemos o contador atômico |
| Server action → monta `Request` e chama `auth.handler()` | vale | reimplementar o `fetch`: encaminhar headers, IP, Origin e reescrever `Set-Cookie` na mão |
| Cliente do better-auth → `POST /api/auth/*` | vale | os formulários de entrar/cadastrar viram Client Components |

A segunda linha merece atenção porque é a que preserva o padrão do projeto:
`rateLimit.customStorage.consume(key, rule)` é uma função que **nós** fornecemos e o
better-auth chama em toda requisição do roteador — se ela é nossa, nada impede de chamá-la
também de dentro de uma server action. Um limitador, uma tabela, cobrindo os dois caminhos.

Foi descartada por um argumento que veio da própria biblioteca: o JSDoc do
`customStorage` diz que eles **removeram** a interface antiga de `get`/`set` porque "essa
forma não consegue impor um limite distribuído sob requisições concorrentes". Ou seja, os
autores já erraram esse contador e tiveram que refazê-lo. Um rate limiter quebrado
**falha em silêncio**: não dá erro, não aparece em teste, só deixa de contar — e você
descobre quando alguém já entrou. Concorrência é exatamente a condição de um ataque de
força bruta. Consistência de padrão não paga esse risco em duas telas.

Escolhida a quarta. **Cadastro e login vão pelo `authClient`** (`createAuthClient`, em
`src/features/auth/auth-client.ts`), que faz uma requisição HTTP normal para
`/api/auth/*` — o caminho que a biblioteca protege e que é, de qualquer forma, o caminho que
um atacante vai usar. Duas consequências que assumimos:

- Os formulários mandam mais JavaScript para o navegador. Aceitável em duas telas.
- A validação deixa de ser "Zod na action" e passa a ter duas camadas (próxima seção).
  Esta é a parte que mais fácil sai errada, e é onde estava o furo da primeira versão
  desta spec.

**`signOut` é a exceção e vai por server action** (`auth.api.signOut` + plugin
`nextCookies()`): sair não precisa de rate limit, e um `<form>` com botão funciona sem
JavaScript, limpa o cookie no servidor e invalida o cache do roteador com `redirect()`.

Server action + `ActionResult` continua sendo o padrão para tudo que é nosso (carrinho,
checkout, admin). O tipo `ActionResult` é reaproveitado também nos formulários do cliente,
para a UI de erro ser a mesma em toda a loja mesmo com o mecanismo diferente por baixo.

Registrar em `docs/adr/0005-auth-goes-through-the-better-auth-client.md`.

### Validação de entrada

Sem server action, não existe mais o ponto óbvio onde o Zod rodava no servidor. Daí a
pergunta que tem que ser respondida explicitamente: **onde cada regra é imposta?**

O princípio não muda com o transporte: **o cliente valida para dar feedback, o servidor
impõe.** Qualquer pessoa consegue `curl -X POST /api/auth/sign-up/email` e nunca ver o nosso
formulário. Regra que só existe no navegador não é regra, é conveniência.

Três camadas, cada uma com um trabalho diferente:

| Camada | Onde roda | O que faz |
|---|---|---|
| `signUpFormSchema` / `signInSchema` (Zod) | navegador | mensagem em pt-BR, feedback imediato, confirmação de senha |
| Validação própria do better-auth | servidor | formato de e-mail, `minPasswordLength`/`maxPasswordLength` |
| `hooks.before` no `src/server/auth.ts` | servidor | **as nossas regras que a biblioteca não cobre** |

A terceira camada é a correção. O better-auth aceita um `hooks.before` com
`createAuthMiddleware`: ele roda dentro do roteador HTTP (**depois** do rate limit, antes do
endpoint), enxerga `ctx.path` e `ctx.body`, e recusa com `APIError("BAD_REQUEST", ...)`.
É ali que o nosso schema roda no servidor, sem trocar o transporte nem duplicar o
limitador.

Duas consequências para os tickets:

- **O schema tem que ser partido em dois** (ticket 06): um núcleo com o que o servidor
  recebe de verdade (`name`, `email`, `password`) e uma versão de formulário que o estende
  com `confirmPassword` e a comparação. `confirmPassword` não existe no servidor — ele
  recebe uma senha só —, então validá-lo lá é impossível, e não é perda: confirmação de
  senha é proteção contra erro de digitação, não contra atacante.
- **O ticket 03 tem que descobrir, e registrar, o que o better-auth já valida** (não
  assumir). Duplicar `minPasswordLength` no hook é ruído; o que importa é o que ficou
  descoberto. **`name` está confirmado como descoberto**: o schema do endpoint é
  `name: z.string()` puro — sem `min`, sem `max`, sem `trim` — e o handler passa o valor
  **cru** para `createUser`, sem nem passar pelo `parseUserInput`, então nem validador de
  `additionalFields` o alcançaria. Nome vazio ou de 5 mil caracteres entra no banco, no
  header da loja e, na Feature 2, no assunto de um e-mail. `email` e `password` a
  biblioteca cobre (formato, `minPasswordLength`/`maxPasswordLength`, e normaliza o e-mail
  para minúsculas).

A mensagem do hook **não** precisa ser bonita. Quem chega nele já passou por fora do
formulário: ou é um bug nosso, ou é alguém sondando na mão. O caminho de UX é a camada 1.

### Papéis

Plugin `admin()` com `defaultRole: "user"` e `adminRoles: ["admin"]`. Ele adiciona
`role`, `banned`, `banReason`, `banExpires` em `user` e `impersonatedBy` em `session`.

Nesta feature usamos só `role`. O bloqueio de login de quem está banido vem junto e fica
ativo desde já, mesmo sem a tela de banir (Feature 10). Impersonation não é usada.

`role` **nunca** vem de formulário. Um cadastro que aceitasse `role` no corpo da requisição
seria escalada de privilégio em um POST. O plugin define o papel pelo `defaultRole` no
servidor.

O primeiro Admin é criado **promovendo**, não criando: a pessoa se cadastra por `/cadastro`
como qualquer Cliente e um script fora da interface troca o `role` para `"admin"`
(ticket 14). Três motivos: o script não toca em senha, então não pode errar hash nem vazar
credencial em `ps`; é muito menos código; e **promover é a operação que a Feature 10 vai
precisar de qualquer forma**, enquanto "criar usuário do nada" é um caminho que existiria
uma vez na vida do projeto.

IDs: mantemos o padrão do better-auth (string aleatória), não `serial`. ID sequencial de
usuário é convite a enumeração e a IDOR — `/conta/pedidos/124` depois de ver o 123.

### Sessão

- `expiresIn` 7 dias, `updateAge` 1 dia (são os padrões; ficam escritos no config para
  serem visíveis e discutíveis).
- **`cookieCache` desligado**, e o motivo não é o óbvio. O argumento comum seria "revogação
  imediata": com cache, banir um Cliente ou derrubar uma sessão só valeria quando o cookie
  expirasse. Só que, em `auth-core`, **nada consome essa garantia ainda** — banir é a
  Feature 10, "sair de todos os dispositivos" é a Feature 2, e sair no próprio aparelho já
  apaga o cookie ali mesmo. Pagar adiantado por uma garantia sem consumidor não é uma razão.

  A razão é outra: ligar cache é **otimização, e não temos medição nenhuma**. O preço do
  desligado é uma consulta por requisição (o menu da conta lê a sessão em toda página).
  Ligar sem medir seria trocar uma garantia por um ganho que não foi medido. Reabrir na
  Feature 2, quando "sessões ativas" tornar a semântica de revogação visível ao usuário e
  houver tráfego para medir.
- A consulta é deduplicada por requisição com `cache()` do React: header e página chamando
  `requireUser()` fazem **uma** query, não duas.
- Cookie: `HttpOnly`, `SameSite=Lax`, `Secure` em produção (padrão do better-auth).
  `Lax` e não `Strict` porque o cookie precisa acompanhar o usuário quando ele chega de
  fora — o redirect pós-login e os links de e-mail da Feature 2.
- `trustedOrigins` com a URL de produção: é a checagem de origem do better-auth, contra
  CSRF. Um formulário hospedado em outro domínio não consegue postar no nosso `/api/auth`.

### Autorização

`src/server/session.ts`, três funções e uma regra:

- `getSession()` — `cache()`, devolve a sessão ou `null`. Para quem só quer *saber*.
- `requireUser()` — sem sessão, `redirect("/entrar")`. Devolve o usuário tipado.
- `requireAdmin()` — sem sessão ou `role !== "admin"`, `notFound()`.

`requireAdmin` responde **404, não 403**. Um 403 confirma que a rota existe e que existe
uma área de administração naquele endereço; o 404 não confirma nada. Para quem não é Admin,
`/admin` simplesmente não existe.

> **Nuance medida no ticket 11:** o 404 não esconde que `/admin` existe. O link para `/admin`
> está no JavaScript do menu da conta, que todo visitante baixa, e a 404 de uma rota que
> existe tem estrutura diferente da 404 de uma URL inexistente (o Next a renderiza por outro
> caminho). O que o 404 faz é não *anunciar*, e o que realmente importa é outro ponto:
> **nenhuma interface de administração é renderizada para quem não é Admin**, nem no
> payload. A proteção é o `requireAdmin()`, não o segredo do endereço.

Mas o 404 esconde a recusa de **nós** também: um Admin que perdeu o papel (bug, ban, script
do ticket 14 rodado errado) reporta "o site quebrou", e você depura autorização olhando um
404. Por isso o 404 vem com uma emenda obrigatória: **`requireAdmin` registra no log do
servidor** quando recusa alguém que está logado, com o id do usuário. A resposta na rede
continua opaca; a informação fica do nosso lado. Sem esse log, escolher 404 é esconder
informação de si mesmo junto com o atacante.

Não usamos `unauthorized()` nem `forbidden()` do Next: exigem
`experimental.authInterrupts`. Flag experimental na espinha da autorização de um projeto que
vai para produção é risco sem retorno — `redirect` e `notFound` são estáveis e resolvem.

ADR 0003 já vale aqui: a checagem real acontece onde o dado é lido e escrito, em toda
página, action e query. O `proxy.ts` é conveniência.

### `proxy.ts`

Roda em toda requisição, então faz **só checagem otimista**: olha se o cookie de sessão
existe, sem validar nada no banco.

- `/conta/*` e `/admin/*` sem cookie → `/entrar?next=<pathname>`.
- ~~Com cookie em `/entrar` ou `/cadastro` → `/conta`.~~ **Removida no ticket 12:** com um
  cookie que existe mas não vale (vencido, encerrado, inventado), essa regra e o
  `requireUser()` mandavam a pessoa de uma página para a outra até o navegador desistir. As
  páginas já redirecionam quem está logado, com a sessão validada no banco. Ver ADR 0003.
- **Não checa papel.** O papel está no banco, e o proxy não consulta banco: ele roda até em
  prefetch de link, e uma query ali multiplica carga por navegação.

O `?next=` nasce aqui, no proxy, porque é ele que sabe qual página o usuário queria. O
`requireUser()` redireciona para `/entrar` seco: quando ele é alcançado, o proxy já falhou
ou não cobriu aquele caminho, e o papel dele é segurança, não conveniência.

Por que o proxy nunca é a única defesa: a CVE-2025-29927 permitia pular o middleware do
Next com um header na requisição. Além disso ele não roda em todo caminho de código — uma
server action chamada de uma página pública não passa por ele.

`matcher` fora de `/api/auth`, `_next` e estáticos.

### Anti-enumeração

Descobrir **quais e-mails têm conta** na loja já é um vazamento: serve para phishing
direcionado e para uma lista de alvos de força bruta.

Aqui a spec original estava errada em um ponto e vaga em outro. Os fatos, verificados no
código da v1.7.5 (não na doc, que não lista esses códigos):

- **Login: já está resolvido pela biblioteca, não por nós.** O `/sign-in/email` devolve um
  código único, `INVALID_EMAIL_OR_PASSWORD` (401), para os três caminhos de falha: usuário
  inexistente, conta sem senha e senha errada. E o código faz hash de uma senha falsa nos
  casos em que não há senha para conferir, com um comentário dizendo que é contra ataque de
  **timing** — a diferença de tempo de resposta também é um canal de enumeração, e eles
  fecharam. Não existe par de códigos para colapsar: o ticket 07 **verifica** isso e traduz,
  não implementa a proteção.
- **Cadastro: vazaria no endpoint, não na nossa tela.** Com a configuração **padrão**
  (`autoSignIn: true`, sem verificação de e-mail), `/sign-up/email` responde
  **422 `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL`** para e-mail existente. Um `curl` distingue
  200 de 422 e enumera à vontade, qualquer que seja a frase que a nossa interface mostre.
  A proteção do better-auth (resposta 200 com usuário sintético, `token: null`, timing
  igualado) só liga quando `requireEmailVerification: true` **ou** `autoSignIn: false`.
  `onExistingUserSignUp` e `customSyntheticUser` não ligam nada: o primeiro é o callback de
  aviso ao dono do e-mail, o segundo monta o usuário falso para ele não ser distinguível
  quando um plugin adiciona colunas (o plugin admin adiciona quatro).

  **Fechado nesta feature, com `autoSignIn: false`** (ver "Fluxo do cadastro" abaixo).
  A Feature 2 mantém a proteção e melhora a mensagem: com verificação de e-mail, a resposta
  genérica passa a poder dizer "confira seu e-mail", e o `onExistingUserSignUp` avisa o dono
  do endereço que alguém tentou se cadastrar com ele.
- O que realmente segura enumeração **em massa** é o rate limit, não a mensagem.

### Fluxo do cadastro

Quem se cadastra **não entra automaticamente**: `autoSignIn: false`. O fluxo é
cadastro → tela de confirmação → login.

Isso não é atrito gratuito, são três coisas de uma vez:

1. **Liga a proteção contra enumeração no cadastro.** É a única chave disponível nesta
   feature: a resposta genérica do better-auth (200 com usuário sintético, `token: null`,
   timing igualado) acende com `autoSignIn: false` **ou** `requireEmailVerification: true`,
   e a segunda depende do Resend, que é Feature 2. Sem isso, `/sign-up/email` responde 422
   para e-mail existente e enumera.
2. **É o estado final, não uma escala.** A Feature 2 exige e-mail verificado antes da
   sessão, e aí login automático é impossível por definição. Manter `autoSignIn: true` agora
   significa escrever o caminho de pós-cadastro duas vezes e jogar um fora.
3. **O caso comum se resolve sozinho.** Quem se cadastra com um e-mail que já tem conta é,
   quase sempre, o dono dele que esqueceu que já tinha — ele vê "conta criada, faça login",
   vai ao login, usa a senha dele e entra. O caso que realmente empaca é digitar o e-mail
   **de outra pessoa** que já tem conta: mais raro, e sem solução honesta sem e-mail.

**O que a tela pode dizer nesta feature:** que a conta foi criada e que é para entrar.
**Não** pode dizer "enviamos um e-mail de confirmação" — nada é enviado até a Feature 2.
A troca dessa frase é o marco de que a Feature 2 ligou a verificação.

**A parte que faz a proteção ser real, e não cosmética:** a resposta sintética do
better-auth traz só os campos do núcleo do `user`. O plugin admin adiciona quatro colunas
(`role`, `banned`, `banReason`, `banExpires`), então **sem intervenção a resposta falsa é
distinguível da verdadeira pelo conjunto de chaves** — a proteção estaria ligada e não
protegendo nada. É para isso que existe `emailAndPassword.customSyntheticUser`: montar o
usuário falso com os campos dos plugins, na ordem certa (núcleo → plugin → adicionais → `id`
por último, para casar com a ordem que o banco devolve). Ticket 03, e é ele que precisa ser
verificado com `curl`, não lido no config.

### Senha

- `minPasswordLength: 8`, `maxPasswordLength: 128`. O máximo não é frescura: hash de senha
  é caro de propósito, e aceitar 1 MB de senha é DoS por CPU de graça.
- Hash: scrypt, o padrão do better-auth. Não trocamos.
- **Sem regra de composição** (1 maiúscula, 1 símbolo, 1 número). Regra de composição
  empurra todo mundo para `Senha@123` e mede a coisa errada. O que protege de verdade é
  comprimento mínimo + a checagem de senha vazada da Feature 2 (HIBP), que reprova
  `Senha@123` justamente por ela estar em toda lista de vazamento.
- O Zod valida o mesmo mínimo do servidor (ticket 06), com confirmação de senha no cadastro.

### Rate limit

`storage: "database"`, com um model `RateLimit` no Prisma e `enabled: true` também em
desenvolvimento (para dar para testar).

Por que no banco e não em memória, que é o padrão: na Vercel cada requisição pode cair em
uma instância diferente, e instância nova começa com o contador zerado. "5 tentativas por
minuto" em memória vira "5 por minuto **por instância**" — ou seja, ilimitado para quem
sabe disso. Contador compartilhado exige armazenamento compartilhado.

**As rotas sensíveis já nascem apertadas, e a doc mente sobre os padrões.** Verificado no
código da v1.7.5: o padrão global é **10s / 100 requisições** (a doc diz 60s — confiar no
código), e existem regras especiais embutidas que a doc não destaca:
`/sign-in*`, `/sign-up*`, `/change-password*` e `/change-email*` já são **3 por 10s**.
Ou seja, `customRules` aqui não é "apertar o que estava solto", é **decidir se 3/10s é o
número que a gente quer** — e talvez afrouxar a janela em troca de um teto mais baixo por
minuto. Precedência: global → regra especial embutida → regra de plugin → `customRules`.

O trabalho de verdade do ticket 13 é o **armazenamento**: o padrão é memória, e memória em
serverless não conta nada (ver acima).

Limites honestos, dois:

- **É por IP.** A chave é literalmente `${ip}|${path}`, e `customRules` só trocam janela e
  máximo — **não trocam a chave**. Então um atacante com 100 IPs testa 100× mais senhas
  **na mesma conta** e nenhum limite reclama.

  Contar por e-mail é possível, e o lugar é inesperado: o `hooks.before` (o mesmo da camada
  3 de validação) roda no roteador e enxerga `ctx.body.email`. **Adiado de propósito para a
  Feature 2**, não por preguiça: a Feature 2 traz Turnstile, que ataca esse mesmo cenário de
  forma mais forte (custo por tentativa, independente de IP) e sem contador de concorrência
  nosso. Construir o contador por e-mail agora é trabalho que o Turnstile pode tornar
  desnecessário — a decisão se reabre lá, com as duas soluções na mesa para comparar.
- IP é compartilhado (NAT, operadora) e trocável (botnet, proxy residencial). Rate limit é
  atrito, não barreira — transforma "1000 senhas por segundo" em "algumas por minuto",
  o que muda o ataque de viável para caro. IPv6 é colapsado por prefixo /64 para dificultar
  rotação de endereço.

Resposta ao estourar: **429** com o header `X-Retry-After` (não `Retry-After`).

### Rotas e telas

| Rota | Grupo | Acesso |
|---|---|---|
| `/entrar` | `(store)` | público; com sessão, redireciona |
| `/cadastro` | `(store)` | público; com sessão, redireciona |
| `/conta` | `(store)` | Cliente |
| `/admin` | `(admin)` | Admin; Cliente recebe 404; Visitante vai para o login (proxy) |
| `/api/auth/*` | – | público, do better-auth |

- `/entrar` e `/cadastro` ficam dentro de `(store)`: são páginas da loja e têm header e
  footer. `/admin` fica fora, com layout mínimo próprio (a Feature 3 constrói o de verdade).
- **`src/app/(store)/loading.tsx` sai** (ticket 08). Ele é um skeleton de grade de produtos
  aplicado a todo o grupo: apareceria piscando no login. Cada segmento que precisar ganha o
  seu, a partir da Feature 5. Isso também resolve a nota da Feature 5 no roadmap: sem
  `loading.tsx` ancestral, `notFound()` volta a responder 404 de verdade.
- Header: menu da conta lendo a sessão dentro de `<Suspense>`, para o resto do header não
  esperar o banco.

**Consequência de ler a sessão no header: as páginas da loja passam a ser dinâmicas.**

Metade disso é proteção de verdade: uma página com o nome de uma pessoa no cache estático da
CDN seria servida para a próxima visitante — vazamento de dado por cache, não por bug de
código. Confirmar no deploy (ticket 15) que página autenticada não vem com
`x-vercel-cache: HIT`. Isso também encerra a nota da Feature 1 no roadmap sobre o
`access-control-allow-origin: *` do cache estático da Vercel: resposta autenticada não passa
mais por lá.

A outra metade é uma conclusão que **não** segue: "logo, tudo fica dinâmico". A Feature 5 é
a que mais quer CDN — página de Produto é o caso perfeito de cache — e estaríamos entregando
isso por um nome no header. **Esta é uma decisão emprestada, não definitiva**, e a razão de
mantê-la agora é a mesma da Q do `cookieCache`: hoje não existe página que mereça cache, a
loja tem uma home vazia. Otimizar cache antes de existir catálogo é otimizar sem medir.

As duas alternativas, escritas aqui para a Feature 5 não redescobrir o problema:

- **(b) header neutro**: ícone de conta linkando `/conta`, loja inteira estática, nome só
  dentro de `/conta`. Zero JavaScript, zero dinâmico, e o usuário não vê o próprio nome no
  header.
- **(c) casca neutra estática + troca na hidratação**: um Client Component lê a sessão com
  `authClient.useSession()` e troca para o nome depois que a página carrega. Cache
  preservado **e** nome na tela, ao custo de um flash e de JavaScript. Provavelmente a
  resposta final — e repare que ela só é possível porque a Q1 escolheu manter o
  `authClient`.

## Critérios de aceite

- [ ] `/cadastro` cria um Cliente com `role: "user"`, mostra a confirmação e **não** entra;
      o login em seguida funciona.
- [ ] Cadastro com e-mail já usado mostra **a mesma tela** do cadastro novo e não cria nada;
      as duas respostas do endpoint têm o mesmo status e o mesmo conjunto de chaves.
- [ ] Login com senha errada e login com e-mail inexistente mostram **a mesma** mensagem
      (proteção da biblioteca, verificada por nós no ticket 07).
- [ ] `name` vazio, só com espaços ou gigante é recusado **pelo servidor**, via `curl`,
      sem passar pelo formulário.
- [ ] `requireAdmin` recusando alguém logado deixa uma linha no log do servidor com o id.
- [ ] Sair limpa o cookie e volta para a home; `/conta` volta a exigir login.
- [ ] `/conta` deslogado vai para `/entrar?next=/conta` e, depois do login, volta para `/conta`.
- [ ] `/entrar?next=https://exemplo.invalido` e `?next=//exemplo.invalido` **não** saem do site.
- [ ] `/admin` responde 404 para Cliente e abre para Admin. Visitante vai para
      `/entrar?next=/admin` pelo proxy; sem o proxy, recebe 404 (ticket 12).
- [ ] Renomear `proxy.ts` e `/conta` continua protegida (a defesa real não está nele).
- [ ] Tentar login várias vezes seguidas devolve 429 antes do limite global.
- [ ] Cookie de sessão em produção: `HttpOnly`, `Secure`, `SameSite=Lax`.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam.
- [ ] Deploy na Vercel funcionando; página autenticada não vem do cache estático.

## Riscos conhecidos

- **`server-only` versus a CLI do better-auth.** `src/server/auth.ts` começa com
  `import "server-only"`, e esse pacote **lança erro** quando é importado fora da condição
  `react-server` — ou seja, em qualquer processo Node comum. Então `npx auth generate` e
  `npx auth create-admin`, que importam o nosso config, provavelmente vão explodir.
  Saídas, em ordem de preferência: rodar com `node --conditions=react-server`; ou escrever
  o que a CLI geraria (o schema está documentado, e o primeiro Admin cabe em um script
  nosso que abre o próprio `PrismaClient`, sem importar `src/server/`). Tickets 04 e 14.
- **URL de preview da Vercel.** `BETTER_AUTH_URL` é fixa, e cada preview tem um host novo.
  Se preview quebrar, o better-auth 1.7 aceita `baseURL` dinâmica com
  `allowedHosts: ["*.vercel.app"]`. Só resolver se doer (ticket 15).

## Tickets

| # | Ticket | Responsável | Bloqueado por |
|---|---|---|---|
| 01 | Variáveis de ambiente do better-auth | ~~Gustavo~~ Claude | - |
| 02 | `safeRedirectPath` e testes | ~~Gustavo~~ Claude | - |
| 03 | Instalar e configurar o better-auth | Claude | 01 |
| 04 | Tabelas de auth: schema e primeira migration | Claude | 03 |
| 05 | Sessão no servidor: `getSession`, `requireUser`, `requireAdmin` | Claude | 04 |
| 06 | Schemas de cadastro e login (Zod) e testes | ~~Gustavo~~ Claude | - |
| 07 | Mensagens de erro do better-auth em pt-BR | ~~Gustavo~~ Claude | 03 |
| 08 | Página `/entrar` | Claude | 02, 05, 06, 07 |
| 09 | Página `/cadastro` | Claude | 08 |
| 10 | Sair: action de logout e menu da conta no header | Claude | 05 |
| 11 | `/conta` e `/admin` protegidas | Claude | 05 |
| 12 | `proxy.ts` — checagem otimista | Claude | 02, 11 |
| 13 | Rate limit no banco, mais rígido nas rotas sensíveis | ~~Gustavo~~ Claude | 04 |
| 14 | Primeiro Admin | ~~Gustavo~~ Claude | 04, 09 |
| 15 | Deploy na Vercel com autenticação | ~~Gustavo~~ Claude | 01-14 |
| 16 | Doc de estudo da feature | ~~Gustavo~~ Claude | 15 |
| 17 | Tag de estudo e dieta de comentários | Claude | 16 |
