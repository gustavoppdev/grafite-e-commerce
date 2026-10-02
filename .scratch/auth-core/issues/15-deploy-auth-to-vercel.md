# 15 - Deploy na Vercel com autenticação

Status: claimed
Responsável: ~~Gustavo~~ Claude
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

- [ ] Cadastro, login, `/conta`, `/admin` e sair funcionam na URL da Vercel.
- [ ] Cookie de sessão: `HttpOnly`, `Secure`, `SameSite=Lax` (DevTools → Application → Cookies).
- [ ] Página autenticada **não** vem do cache estático: nenhuma resposta com o nome do
      usuário traz `x-vercel-cache: HIT`.
- [ ] `/admin` como Cliente responde 404 em produção.
- [ ] Rate limit funciona em produção (429 depois do limite) e o contador está na tabela —
      é aqui que "memória" versus "banco" aparece de verdade, com várias instâncias.
- [ ] **IP do rate limit não é falsificável em produção** (achado do ticket 13): mandar um
      login com `-H 'X-Forwarded-For: 203.0.113.7'` e conferir na tabela `rateLimit` que a
      chave é o IP **real**, não o inventado. Conferir também que nenhuma chave é
      `no-trusted-ip|...` (seria a loja inteira dividindo 3 logins a cada 10s). Em
      desenvolvimento o `next dev` repassa o header do cliente sem mexer; quem tem que
      sobrescrever é a Vercel. Se não sobrescrever: configurar
      `advanced.ipAddress.ipAddressHeaders` com o header que a Vercel controla.
- [ ] Os headers de segurança da Fundação continuam em todas as respostas.
- [ ] A secret de produção nunca foi commitada nem apareceu em log de build.

## Guia

- **Secret diferente por ambiente:** a de desenvolvimento vive no `.env` da sua máquina, é
  copiada, aparece em backup, em print de tela. Se ela for a mesma da produção, qualquer
  vazamento local permite **forjar sessão de produção**. Vale a mesma pergunta do ticket 01,
  agora com consequência real.

- **URL de preview:** `BETTER_AUTH_URL` é uma URL fixa e cada preview da Vercel tem um host
  novo. Se preview quebrar o login, a spec registra a saída (baseURL dinâmica com
  `allowedHosts: ["*.vercel.app"]`). Antes de ligar isso, pergunte: um curinga `*.vercel.app`
  confia em **qual** conjunto de domínios? Só nos seus? Isso é aceitável para um projeto de
  estudo, mas você precisa saber o que está aceitando.

- **Sobre o cache:** a nota da Feature 1 no roadmap dizia que respostas do cache estático da
  Vercel vêm com `access-control-allow-origin: *` (adicionado pela CDN deles). Com a sessão
  sendo lida no header, as páginas da loja passam a ser dinâmicas e não passam mais por lá.
  Confirme isso e feche a nota no roadmap. Se alguma página autenticada vier do cache, é
  problema sério: o nome de uma pessoa sendo servido para outra.

- **Migrations em produção:** `migrate dev` nunca roda em produção (ele pode reescrever
  histórico e pede confirmação interativa). Reveja o que ficou registrado no ticket 04 e
  decida **como** as migrations chegam ao banco de produção: no build da Vercel, ou por você,
  da sua máquina, antes do deploy? A conexão direta (`DIRECT_URL`) não está na Vercel de
  propósito (o comentário no `env.schema.ts` explica) — isso decide a resposta.

- **Verifique com requisição, não só com o olho.** `curl -I` na URL de produção mostra
  headers e `x-vercel-cache`. Para a página autenticada você precisa mandar o cookie —
  copie do DevTools.

## Comments

### 2026-10-01 — Claude: duas pendências vindas do ticket 07

- **Região da função.** O Supabase está em `sa-east-1` (São Paulo). Se as funções da
  Vercel rodarem na região padrão (EUA), cada consulta atravessa o continente, e o login
  faz várias. Configurar a região das funções para `gru1` (São Paulo) e conferir.
- **Piso de tempo do login e do cadastro (800ms).** Medir em produção o tempo dos caminhos
  lentos (cadastro com e-mail novo, login com senha errada). Se o p99 passar de ~600ms, subir
  o `MINIMUM_RESPONSE_MS` em `src/app/api/auth/[...all]/route.ts`, senão as respostas lentas
  escapam do piso e a diferença volta a aparecer.
