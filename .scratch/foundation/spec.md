# Feature 0: Fundação

## Objetivo

Deixar o projeto pronto para receber features: stack instalada, direção visual aplicada, padrões globais (erros, loading, resultado de actions, toasts), conexão com o banco, headers de segurança, testes e **deploy funcionando na Vercel**. Nenhuma regra de negócio ainda.

Ao final, abrir a URL da Vercel mostra a home vazia da loja com header e footer, `/api/health` confirma o banco e `/design-system` (só em desenvolvimento) mostra os tokens visuais.

## Fora do escopo

- Qualquer model de domínio (Product, Order...). O primeiro schema real vem na Feature 1 (tabelas do better-auth) e na Feature 3.
- Autenticação, `proxy.ts`, `requireUser`/`requireAdmin` (Feature 1).
- react-hook-form (primeiro formulário real é na Feature 3).

## Decisões

### Stack e ferramentas
- Next.js (versão estável mais recente, App Router, Turbopack), TypeScript `strict`, pnpm, Biome, Tailwind CSS v4, shadcn/ui.
- Prisma + Supabase (Postgres). Conferir a documentação **atual** do Prisma para Supabase na hora de implementar, porque a configuração mudou entre versões.
- Vitest para testes unitários.
- Código e identificadores em inglês; UI em pt-BR (`<html lang="pt-BR">`).

### Estrutura de pastas

```
src/
├── app/                      rotas finas: só compõem features e componentes
│   ├── (store)/              layout com header/footer da loja
│   ├── design-system/        referência visual (só em desenvolvimento)
│   └── api/health/
├── components/
│   ├── ui/                   gerado pelo shadcn (não editar à toa)
│   └── layout/               header, footer, container
├── features/<feature>/       actions.ts, queries.ts, schemas.ts, components/
└── lib/                      infraestrutura compartilhada: env, prisma, format, action-result
prisma/
```

### Direção visual (referência: therow.com, adaptada)

| Token shadcn | Valor | Uso |
|---|---|---|
| `--background` | `#FFFFFF` | fundo |
| `--foreground` / `--primary` | `#1C1B1B` | texto, botão principal |
| `--primary-foreground` | `#FFFFFF` | texto sobre primário (hover do botão) |
| `--muted` | `#F8F6F5` | **placeholder do Produto**, fundos sutis |
| `--muted-foreground` | `#6A6A6A` | texto secundário, "Esgotado" (contraste 5.3:1) |
| `--border` / `--input` | `#E8E6E5` | linhas e bordas de campos |
| `--ring` | `#1C1B1B` | foco visível |
| `--destructive` | `#9F2D2D` | erros |
| `--radius` | `0` | tudo reto |

- `#A5A3A3` apenas para itens riscados/desabilitados, **nunca** texto que precisa ser lido.
- Fonte **Hanken Grotesk** via `next/font`, pesos 400 e 500. Loja usa só 400; admin pode usar 500 em cabeçalhos.
- Base 14px, metadados 13px. Hierarquia por espaço e posição, não por tamanho ou negrito.
- Logo: nome da loja em caixa alta, espaçamento largo entre letras, pequeno.
- **Botão principal contornado**: borda 1px `foreground`, fundo transparente; no hover inverte (fundo `foreground`, texto branco). Largura total em ações principais.
- Foco visível (outline 1px) em todo elemento interativo.
- Só tema claro.

### Header da loja
- Desktop: logo à esquerda **ou** centralizado (decidir vendo na tela), links de categorias visíveis, ícones de busca e carrinho à direita. Altura ~60px.
- Mobile: menu hambúrguer à esquerda (shadcn `Sheet`), logo centralizado, carrinho à direita.
- Nesta feature as categorias são links fixos de exemplo; na Feature 4 viram dados reais.

### Padrões globais
- **Env:** `src/lib/env.ts` valida `process.env` com Zod na inicialização, falha com mensagem clara, marcado com `server-only`. `.env.example` versionado, `.env` no `.gitignore`.
- **Resultado de server actions:** tipo único `ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> }`. Actions nunca lançam erro para o cliente com detalhes internos.
- **Toasts:** shadcn `sonner`, um `<Toaster />` no layout raiz.
- **Erros:** `error.tsx` (por segmento, com botão "Tentar novamente"), `global-error.tsx` (erro no layout raiz), `not-found.tsx` (404 da loja). Mensagens em pt-BR, sem stack trace para o usuário.
- **Loading:** `loading.tsx` com skeleton que imita o layout real (não spinner genérico).
- **Dinheiro:** valores sempre em **centavos (inteiro)**. `formatPrice(cents)` em `src/lib/format.ts` formata em BRL com `Intl.NumberFormat("pt-BR")`.
- **Nome da loja:** em uma constante `siteConfig` (`src/lib/site.ts`), usado no logo e no metadata.

### Banco
- Supabase só como Postgres. Duas URLs: **pooler (transaction mode)** para a aplicação em runtime/serverless e **conexão direta/session** para migrations.
- Cliente Prisma único (singleton) em `src/lib/prisma.ts` com `server-only`, evitando múltiplas conexões no hot reload.
- Prisma 7.10 com `@prisma/adapter-pg`. A URL do pooler **não** precisa de `?pgbouncer=true`: testado com 900 consultas parametrizadas simultâneas pelo transaction pooler, sem erro (ticket 10).
- TLS **verificado** com a CA do Supabase (`certs/supabase-ca.crt`, pública) na aplicação e na CLI; SSL obrigatório ativo no projeto (tickets 16 e 17).
- `GET /api/health` executa `SELECT 1` e responde `{ status: "ok" }` ou `503 { status: "error" }`, **sem expor a mensagem de erro**.

### Segurança
- Headers no `next.config`: `Content-Security-Policy` (base, sem nonce por enquanto), `X-Frame-Options: DENY` + `frame-ancestors 'none'` (clickjacking), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` desligando câmera/microfone/geolocalização, `poweredByHeader: false`.
- CSP será ajustada nas features 2 (Turnstile) e 10 (revisão final). CSP com nonce força renderização dinâmica em todas as páginas, então fica como decisão da revisão final.
- `/design-system` retorna 404 em produção.

## Critérios de aceite

- [ ] `pnpm dev`, `pnpm build`, `pnpm lint` (Biome) e `pnpm test` passam sem erros.
- [ ] App sobe com env inválida? **Não**: falha com mensagem clara dizendo qual variável está errada.
- [ ] Home da loja mostra header e footer, responsivos em ~400px e desktop.
- [ ] `/design-system` mostra tipografia, cores, botões, inputs, placeholder de Produto e demo de toast via server action; 404 em produção.
- [ ] Erro lançado numa página de teste mostra o `error.tsx`; rota inexistente mostra o `not-found.tsx`.
- [ ] `/api/health` responde `ok` localmente e na Vercel.
- [ ] Headers de segurança presentes na resposta (conferir no DevTools → Network).
- [ ] `formatPrice` coberto por testes, incluindo casos de borda.
- [ ] Deploy na Vercel funcionando, com variáveis de ambiente configuradas lá.

### Nome da loja
- **GRAFITE**, papelaria fina. Logo: `GRAFITE` em caixa alta com letter-spacing largo.

## Próximos passos (atualizado em 2026-09-16)

1. ~~**11** `ActionResult` e toasts (Claude)~~ — resolvido.
2. **03** `/design-system` (Claude): faltam as seções 1 a 5; a de toast e o 404 em produção vieram no 11.
3. **12** Headers de segurança (Claude).
4. **14** Casos de borda de `formatPrice` (Gustavo), em paralelo. Revisar quando ele avisar.
5. **15** Deploy (Gustavo), quando tudo acima estiver `resolved`.

## Tickets

| # | Ticket | Responsável | Bloqueado por |
|---|---|---|---|
| 01 | Criar o projeto e ferramentas | Claude | - |
| 02 | Tema, fonte e tokens visuais | Claude | 01 |
| 03 | Página `/design-system` | Claude | 02, 11 |
| 04 | Header da loja | Claude | 02 |
| 05 | Footer da loja | Claude | 04 |
| 06 | `error.tsx` e `global-error.tsx` | Claude | 04 |
| 07 | `not-found.tsx` e `loading.tsx` | Claude | 06 |
| 08 | Validação de variáveis de ambiente | Claude | 01 |
| 09 | Criar projeto no Supabase e preencher `.env` | Gustavo | 08 |
| 10 | Prisma + Supabase + `/api/health` | Claude | 09 |
| 11 | `ActionResult` e toasts | Claude | 02 |
| 12 | Headers de segurança | Claude | 01 |
| 13 | Vitest e `formatPrice` | Claude | 01 |
| 14 | Casos de borda de `formatPrice` | Gustavo | 13 |
| 15 | Deploy na Vercel | Gustavo | 05, 07, 10, 12, 14, 17 |
| 16 | Certificado SSL do Supabase e SSL obrigatório | Gustavo | 10 |
| 17 | Conexão TLS verificada com o banco | Claude | 16 |
