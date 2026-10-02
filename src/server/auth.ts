import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/config/auth";
import { INVALID_SIGN_UP_FIELDS } from "@/features/auth/errors";
import { signUpSchema } from "@/features/auth/schemas";
import { prisma } from "@/server/db";
import { env } from "@/server/env";

/*
  Instância ÚNICA do better-auth. As rotas HTTP (`/api/auth/*`), a sessão no servidor
  (ticket 05) e o logout (ticket 10) passam todos por aqui.

  Mora em `src/server/` porque carrega o segredo que assina o cookie e o cliente do banco:
  se chegasse ao navegador, qualquer pessoa conseguiria forjar sessão. O formulário fala
  com ela por HTTP, pelo `auth-client.ts` — nunca importando este arquivo (ADR 0005).

  Uma proteção de auth mora FORA deste arquivo: o tempo mínimo de resposta do login e do
  cadastro (contra descobrir pelo cronômetro quem tem conta) fica no route handler,
  `src/app/api/auth/[...all]/route.ts`, porque age sobre a resposta HTTP.
*/

/*
  Papel de quem se cadastra. É uma constante porque é usada em DOIS lugares que não podem
  divergir: no plugin admin (o papel que o banco grava) e no usuário sintético do cadastro
  (o papel que a resposta falsa mostra). Ver `customSyntheticUser` abaixo.
*/
const DEFAULT_ROLE = "user";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  /*
    Defesa contra CSRF. Sem ela, uma página em `site-malicioso.com` poderia ter um
    formulário que posta em `/api/auth/*` — o navegador manda junto o cookie de quem está
    logado, e a ação acontece em nome da vítima sem ela clicar em nada no nosso site.

    O better-auth confere o header `Origin` de toda requisição que muda estado contra esta
    lista e recusa o que não bate. A origem do `baseURL` já entra sozinha (conferido em
    `context/helpers.mjs`); ela está escrita aqui para a lista ser visível e para ser
    ESTE o lugar de acrescentar outra origem, se um dia precisar (preview da Vercel, ticket 15).
  */
  trustedOrigins: [env.BETTER_AUTH_URL],

  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,

    /*
      Os números e o porquê de cada um estão em `src/config/auth.ts`. Eles vêm de lá, e não
      escritos aqui, porque o schema do formulário (ticket 06) usa os mesmos: se
      divergissem, o formulário aceitaria o que o servidor recusa e a pessoa leria um erro
      em inglês.
    */
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,

    /*
      Cadastro NÃO faz login. Além de ser o fluxo final (a Feature 2 exige e-mail
      verificado antes de ter sessão), é a chave que liga a proteção contra ENUMERAÇÃO:
      com `autoSignIn: false`, cadastrar um e-mail que já existe devolve 200 com um usuário
      falso e `token: null`, igual ao cadastro novo. Com `true`, devolve 422
      `USER_ALREADY_EXISTS` — e um `curl` descobre quais e-mails têm conta na loja.
    */
    autoSignIn: false,

    /*
      É ISTO que faz a proteção acima existir de verdade.

      A resposta falsa só esconde a conta se for indistinguível da verdadeira. Conferido no
      código da 1.7.6 (`buildSyntheticUserOutput`): sem esta função, o better-auth já monta
      o usuário falso com TODAS as chaves, inclusive as do plugin admin, e na ordem certa —
      mas preenche cada campo com o `defaultValue` do schema, e `role` não tem um (quem
      grava `"user"` é um hook de banco do plugin, que não roda para usuário falso).
      Resultado sem esta função:

        cadastro novo      → "role": "user"
        e-mail já existe   → "role": null      ← a resposta entrega que a conta existe

      A proteção estaria ligada e não protegendo nada. Aqui preenchemos os campos do
      plugin com os mesmos valores que um cadastro real recebe.

      A ordem das chaves NÃO depende deste objeto: o better-auth reordena o resultado pelo
      schema (núcleo → adicionais → plugins → `id`), que é a mesma ordem da resposta real.
    */
    customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
      ...coreFields,
      role: DEFAULT_ROLE,
      banned: false,
      banReason: null,
      banExpires: null,
      ...additionalFields,
      id,
    }),
  },

  session: {
    // 7 dias de validade, renovada no máximo uma vez por dia enquanto a pessoa usa a loja.
    // São os padrões da biblioteca, escritos aqui para ficarem visíveis e discutíveis.
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,

    /*
      Desligado: toda leitura de sessão consulta o banco. O cache guardaria a sessão
      dentro de um cookie assinado e pouparia essa consulta.

      O motivo não é "revogação imediata" (com cache, derrubar uma sessão só valeria quando
      o cookie expirasse): nesta feature nada revoga sessão ainda. O motivo é que cache é
      otimização e não temos medição nenhuma. O custo do desligado é conhecido — uma query
      por requisição, deduplicada pelo `cache()` do React (ticket 05). Reabrir na Feature 2,
      quando "sessões ativas" tornar a revogação visível e houver tráfego para medir.
    */
    cookieCache: { enabled: false },
  },

  /*
    Cookie de sessão: não configuramos nada porque o padrão já é o certo, e foi conferido
    em `cookies/index.mjs`:

    - `HttpOnly`: JavaScript da página não lê o cookie. Um XSS consegue agir na página, mas
      não consegue ROUBAR a sessão para usar em outro lugar.
    - `Secure` quando o `baseURL` é https (o env exige https em produção): o cookie nunca
      viaja em texto puro.
    - `SameSite=Lax`, e não `Strict`: com `Strict`, o navegador não manda o cookie quando a
      pessoa chega de FORA do site — clicar num link nosso vindo do Google ou de um e-mail
      (Feature 2) abriria a loja deslogada. `Lax` manda o cookie nessas navegações e segura
      os POSTs de outros sites, que é onde mora o CSRF (com `trustedOrigins` em cima).

    IDs: string aleatória, o padrão da biblioteca. NUNCA `serial`: com IDs sequenciais,
    quem vê o próprio pedido 123 sabe que existe o 124 e tenta abri-lo (IDOR), e um ID de
    usuário revela quantas contas a loja tem.
  */

  /*
    Rate limit: contra FORÇA BRUTA (milhares de senhas numa conta) e CREDENTIAL STUFFING
    (a lista de e-mail+senha vazada de outro site, testada aqui porque muita gente repete
    senha). É também o que dá sentido às mensagens genéricas do ticket 07: sem limite,
    daria para testar 10 mil e-mails por minuto mesmo sem resposta reveladora.

    Vale só para o que passa pelo roteador HTTP (`/api/auth/*`). `auth.api.*` chamado do
    servidor NÃO é limitado; por isso entrar e cadastrar vão pelo `authClient` (ADR 0005).
  */
  rateLimit: {
    // O padrão é `isProduction`: sem isto, o limite nunca rodaria em desenvolvimento e a
    // primeira vez que ele funcionasse (ou falhasse) seria em produção.
    enabled: true,

    /*
      No banco (tabela `rateLimit`), não na memória. Na Vercel cada requisição pode cair numa
      instância diferente, e instância nova nasce com o contador zerado: em memória, "3 por
      10s" vira "3 por 10s POR INSTÂNCIA", ilimitado para quem souber disso.

      O contador no banco é atômico (conferido em `api/rate-limiter`, v1.7.6): o incremento
      é um UPDATE condicional ("só se count < max"), então 50 tentativas simultâneas não
      passam todas por terem lido o mesmo número antes de alguém gravar.

      Não configurar `customStorage` junto: se existir, ele ganha deste em silêncio.
    */
    storage: "database",

    /*
      Limite GLOBAL, para toda rota de `/api/auth` sem regra própria. São os padrões do
      código (a doc diz 60s; o código da 1.7.6 diz 10s), escritos para não mudarem por baixo
      numa atualização.

      As rotas sensíveis já têm regra embutida mais rígida, que mantivemos (a conta está no
      ticket 13): `/sign-in*`, `/sign-up*`, `/change-password*` e `/change-email*` são
      3 por 10s. Por isso não há `customRules`.

      Como a biblioteca conta: a janela começa na última tentativa ACEITA, não num relógio
      fixo. Três tentativas seguidas e a quarta é recusada até passarem 10s da terceira. Não
      existe o "efeito de borda" de janela fixa (3 no segundo 9 + 3 no segundo 11), e a
      tentativa recusada não estica o bloqueio.

      O que isto NÃO resolve: a chave é `${ip}|${caminho}`. Com 100 IPs, 100× mais senhas
      na mesma conta; e IP é compartilhado (operadora, NAT) e trocável (proxy, botnet).
      Rate limit por IP é atrito, não barreira. O resto vem na Feature 2 (Turnstile, senha
      vazada, e a decisão de contar também por e-mail).
    */
    window: 10,
    max: 100,

    /*
      De onde sai o IP: do `x-forwarded-for` (padrão, sem `advanced.ipAddress`), e só se o
      header tiver UM valor. Quem manda a requisição escreve o que quiser nele; com vários
      valores, o primeiro é justamente o que o cliente pode ter inventado, e a biblioteca se
      recusa a escolher (conferido em `@better-auth/core/utils/ip`).

      O risco do outro lado: sem IP confiável, em produção, TODO MUNDO cai numa chave só
      ("no-trusted-ip|/sign-in/email") e a loja inteira divide 3 logins a cada 10s. Segundo
      a doc da Vercel, lá o header chega com um valor só, escrito por ela por cima do que o
      cliente mandou. O ticket 15 confere isso nas chaves da tabela em produção.

      Em desenvolvimento, sem o header, a biblioteca usa 127.0.0.1.
    */
  },

  /*
    Camada 3 da validação (tabela na spec): as NOSSAS regras que o better-auth não impõe.

    Roda dentro do roteador HTTP, depois do rate limit e antes do endpoint, e também nas
    chamadas `auth.api.*` do servidor (conferido em `api/dispatch.mjs`). Quem chega a
    recusar aqui já passou por fora do formulário, por isso a mensagem é técnica.

    O que a biblioteca JÁ valida no `/sign-up/email` (conferido em `api/routes/sign-up.mjs`,
    v1.7.6), e por isso não repetimos:
    - `email`: formato (`z.email()`), e grava em minúsculas. NÃO faz `trim`: " ana@x.com"
      é recusado como inválido, não corrigido.
    - `password`: não vazia, `minPasswordLength` e `maxPasswordLength`.
    - `role`, `banned`, `banReason`, `banExpires`: `input: false` no plugin admin. Mandar
      `"role": "admin"` no corpo devolve 400 `FIELD_NOT_ALLOWED`. É por isso que o papel
      NUNCA vem do formulário: se viesse, um POST montado à mão viraria Admin.
    - Chaves que não existem no schema do `user` são descartadas.

    O que ficou DESCOBERTO, e é trabalho deste hook:
    - `name`: o schema do endpoint é `z.string()` puro (sem mínimo, máximo nem `trim`), e o
      handler grava o valor cru, sem passar pelo `parseUserInput`. Nome vazio, só espaços
      ou com 5 mil caracteres entra no banco, no header da loja e, na Feature 2, no assunto
      de um e-mail. → validado pelo `signUpSchema` (ticket 06).
    - `image`: o endpoint aceita qualquer string e grava. A loja não tem foto de perfil,
      então ninguém de fora deveria conseguir guardar uma URL arbitrária associada à conta.
  */
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;

      if (ctx.body?.image !== undefined) {
        throw new APIError("BAD_REQUEST", {
          message: "image is not accepted on sign-up",
        });
      }

      /*
        O mesmo schema do formulário, agora imposto no servidor. Quem é recusado aqui
        passou por fora do formulário (que já teria avisado em pt-BR), então a resposta é
        técnica: diz QUAIS campos falharam, nunca repete os valores recebidos.

        `email` e `password` também são validados pela biblioteca logo depois. Rodar o
        schema inteiro em vez de só o `name` é de propósito: uma regra, um lugar.
      */
      const parsed = signUpSchema.safeParse(ctx.body);
      if (!parsed.success) {
        const fields = [...new Set(parsed.error.issues.map((i) => i.path[0]))];
        throw new APIError("BAD_REQUEST", {
          code: INVALID_SIGN_UP_FIELDS,
          message: `invalid sign-up fields: ${fields.join(", ")}`,
        });
      }

      /*
        Devolver o corpo NORMALIZADO faz o endpoint gravar o valor limpo: nome sem espaços
        nas pontas, e-mail sem espaços e em minúsculas. Sem isto, o hook validaria
        " Ana " e o banco guardaria " Ana " mesmo assim. O better-auth mescla este `body`
        sobre o original antes de chamar o endpoint (conferido em `api/dispatch.mjs`).
      */
      return { context: { body: { ...ctx.body, ...parsed.data } } };
    }),
  },

  /*
    `nextCookies()` fica POR ÚLTIMO de propósito. Ele pega os cookies que os outros passos
    decidiram gravar e repassa para o `cookies()` do Next — sem ele, um `auth.api.signOut`
    chamado de uma server action (ticket 10) não apagaria o cookie no navegador. Se
    rodasse antes de um plugin que mexe em cookie, perderia o que esse plugin gravou.

    `admin()`: adiciona `role` e o bloqueio de login para banidos (ativo desde já, mesmo
    sem a tela de banir, que é a Feature 10).
  */
  plugins: [
    admin({ defaultRole: DEFAULT_ROLE, adminRoles: ["admin"] }),
    nextCookies(),
  ],
});
