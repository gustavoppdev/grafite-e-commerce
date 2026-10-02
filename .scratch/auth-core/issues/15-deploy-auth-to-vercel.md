# 15 - Deploy na Vercel com autenticação

Status: resolved
Responsável: Claude
Blocked by: 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14

## O que

Colocar a feature em produção e conferir em produção o que só dá para conferir lá: cookie
seguro, cache e origem confiável.

- Variáveis na Vercel: `BETTER_AUTH_SECRET` (**diferente** da local) e `BETTER_AUTH_URL`
  com a URL de produção.
- Migrations aplicadas no banco de produção.
- Criar o Admin de produção (ticket 14) — e decidir se é a mesma conta ou outra.
- Conferir a lista abaixo no navegador, em `https://`.

## Critérios de aceite

- [x] Cadastro, login, `/conta` e `/admin` funcionam na URL da Vercel (testado por `curl`).
      Sair e o fluxo completo na tela: conferência do Gustavo no navegador.
- [x] Cookie de sessão: `HttpOnly`, `Secure`, `SameSite=Lax` (e prefixo `__Secure-`).
- [x] Página autenticada **não** vem do cache estático: `/conta` com cookie respondeu com o
      nome, `cache-control: private, no-store` e `x-vercel-cache: MISS`.
- [x] `/admin` como Cliente responde 404 em produção.
- [x] Rate limit funciona em produção (429 na 4ª tentativa) e o contador está na tabela.
- [x] **IP do rate limit não é falsificável em produção** (achado do ticket 13).
- [x] Os headers de segurança da Fundação continuam em todas as respostas.
- [x] A secret de produção nunca foi commitada nem apareceu em log de build.

## Comments

### 2026-10-02 — Claude

**Três problemas achados ANTES do push, e corrigidos:**

1. **O último deploy de produção (de 16/09) tinha falhado sem ninguém notar.** Erro:
   `Module not found: Can't resolve '@/generated/prisma/client'`. Causa, reproduzida
   localmente: a Vercel restaura o `node_modules` do cache de build, o pnpm responde
   "Already up to date" e **não roda o `postinstall`**; como `src/generated/` fica fora do
   git (e fora do cache), o client do Prisma não existia. Correção: `"build": "prisma
   generate && next build"`. O `generate` não precisa de banco. Lição: o site continuou no
   ar com o deploy anterior, então a falha ficou invisível; depois de todo push, conferir o
   status do deploy, não só o site.
2. **Funções em Washington (`iad1`), banco em São Paulo (`sa-east-1`).** Cada consulta
   atravessava o continente, e um login faz várias (rate limit, usuário, conta, sessão).
   Além de lento, isso ameaçava o piso de 800ms do ticket 07: se o caminho real passar do
   piso, o tempo volta a revelar quem tem conta. `vercel.json` com `"regions": ["gru1"]`.
   Conferido: `x-vercel-id: gru1::gru1::…`. (O BUILD continua em `iad1`; isso não importa.)
3. **Aviso no cadastro** (decisão de portfólio): "Loja de demonstração. Use uma senha que
   você não usa em nenhum outro lugar." Visitantes vão criar conta, e o risco real para
   eles é reaproveitar senha.

**Variáveis na Vercel (Production):**
- `BETTER_AUTH_SECRET`: gerada com `openssl rand -base64 32` e passada por **stdin** direto
  para o `vercel env add --sensitive`. Nunca apareceu na tela, em arquivo, no histórico do
  shell nem no `ps` (por isso não `--value`). Diferente da local. Gravada pelo Gustavo: o
  classificador de permissões bloqueou o agente de gravar segredo de produção, e faz
  sentido que esse passo seja do dono.
- `BETTER_AUTH_URL`: `https://grafite-five.vercel.app`.
- **Preview fica sem as variáveis de auth, de propósito.** Só usamos a `main`; uma branch
  com preview falharia na validação do env no build, que é o lado seguro. Se um dia
  precisar, a saída está na spec (`allowedHosts`), com a pergunta de em quem um curinga
  `*.vercel.app` confia.

**Migrations:** o banco de desenvolvimento É o de produção (ticket 04), então as três
migrations já estavam aplicadas (`prisma migrate status`: up to date). Procedimento daqui
para frente: aplicar da máquina (a `DIRECT_URL` não está na Vercel) **antes** do push que
depende delas. Separar os bancos ficou fora do escopo com a decisão de portfólio
(AGENTS.md); com usuários de verdade, seria o primeiro passo.

**Testes em produção (`curl`, conta descartável apagada no fim):**

| Teste | Resultado |
|---|---|
| Cadastro | 200, `token: null`, `role: "user"` |
| Login | 200, `__Secure-better-auth.session_token`; `Max-Age=604800`; `HttpOnly; Secure; SameSite=Lax` |
| `/conta` com cookie | 200 com o nome; `private, no-store`; `x-vercel-cache: MISS` |
| `/admin` como Cliente | 404 |
| `/conta` sem cookie | 307 → `/entrar?next=%2Fconta` |
| 5 logins errados seguidos | 401, 401, 401, 429 (`X-Retry-After: 10`), 429 (9) |
| `X-Forwarded-For: 203.0.113.7` (falso) | 429, contado no IP **real** |
| `X-Forwarded-For` com dois valores | 429, contado no IP real |
| Chaves na tabela | só o IP real; nenhuma `203.0.113…`, nenhuma `no-trusted-ip` |
| Headers (`/`, `/entrar`, `/api/health`) | CSP, HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` |
| Log do build | nenhuma ocorrência de `BETTER_AUTH_SECRET` nem de `postgres://` |
| Histórico do git | só o texto de exemplo do `.env.example`; nenhum `.env` versionado |

**A Vercel sobrescreve o `X-Forwarded-For`.** O que o cliente manda é descartado e o header
chega com um valor só, o IP real. Por isso a configuração padrão do better-auth (sem
`advanced.ipAddress`) é segura lá, e o plano B do ticket 13 não foi necessário. Em `next
dev` o mesmo teste ESCAPAVA do limite: a segurança é do conjunto biblioteca + plataforma.

**Tempo de resposta em produção** (servidor = `time_starttransfer − time_pretransfer`,
intercalado, respeitando o rate limit):

| Rota | Caso A | Caso B |
|---|---|---|
| Login | conta existe, senha errada: 844–857 ms | e-mail não existe: 837–877 ms |
| Cadastro | e-mail novo: 836–847 ms | e-mail repetido: 835–837 ms (+1 ponto de 926 ms) |

As faixas se sobrepõem: o piso de 800ms segura em produção, com a função em `gru1`.

**Nota do roadmap fechada:** `access-control-allow-origin: *` não aparece mais. As páginas
são dinâmicas (`private, no-store`) e não passam pelo cache estático da CDN.
