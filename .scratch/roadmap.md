# Roadmap

Cada feature é entregável sozinha e vai para produção (Vercel) ao terminar. Spec em `.scratch/<feature-slug>/spec.md`, tickets em `.scratch/<feature-slug>/issues/NN-<slug>.md`.

| # | Feature | Slug | Aprendizado principal | Status |
|---|---|---|---|---|
| 0 | Fundação | `foundation` | Next 16, pnpm, Biome, shadcn + direção visual, Prisma + Supabase, env com Zod, error/loading/not-found, padrão de resultado das actions, toasts, headers de segurança, Vitest, deploy | **concluída** — https://grafite-five.vercel.app |
| 1 | Auth: essencial | `auth-core` | better-auth, cadastro/login/logout, plugin admin (papéis `user`/`admin`), primeiro Admin fora da interface, `proxy.ts`, `requireUser`/`requireAdmin`, rate limit (no banco, mais rígido em rotas sensíveis), proteção de open redirect | **em andamento** (spec e 17 tickets escritos) |
| 2 | Auth: segurança da conta | `auth-hardening` | Resend + React Email, verificação de e-mail, recuperação de senha, senhas vazadas (HIBP), Turnstile, sessões ativas, derrubar sessões ao trocar senha | pendente |
| 3 | Admin: Categorias e Produtos | `admin-catalog` | CRUD, RHF + Zod, Slug, arquivamento, tabela paginada, seed | pendente |
| 4 | Imagens de Produto | `product-images` | Upload no Admin, storage (Supabase Storage), validação do tipo REAL do arquivo, limite de tamanho, URL assinada, `next/image` | pendente |
| 5 | Catálogo | `storefront-catalog` | Server Components, `nuqs`, busca/filtros/ordenação/paginação na URL, Esgotado, metadata/SEO | pendente |
| 6 | Carrinho | `cart` | Server actions, UI otimista, revalidação de cache, redirect pós-login seguro | pendente |
| 7 | Minha conta: Perfil e Endereços | `account-addresses` | ViaCEP, Endereço padrão | pendente |
| 8 | Checkout e Pagamento | `checkout` | Transação + concorrência de Estoque, revalidação de preço/estoque, snapshots, Frete, cartão (Luhn + cartões de teste), Número do pedido | pendente |
| 9 | Pedidos do cliente | `customer-orders` | Histórico, detalhe, Cancelamento (máquina de estados), checagem de dono (IDOR) | pendente |
| 10 | Admin: Pedidos, Usuários e Dashboard | `admin-operations` | Transições de status, banir Cliente, Faturamento, Estoque baixo, agregações | pendente |
| 11 | Fechamento | `wrap-up` | Playwright (cadastro → compra), revisão final de segurança | pendente |

## Estrutura de pastas

Documento vivo em `docs/structure.md` (árvore atual, onde cada arquivo vai, direção dos
imports). Regra central:
`src/server/` é a fronteira de segurança — todo arquivo lá dentro tem `import "server-only"`,
nenhum fora tem.

## Notas para features futuras

- ~~**Feature 1 (Auth):** respostas do cache estático da Vercel vinham com `access-control-allow-origin: *`.~~ **Fechada no ticket 15 de `auth-core`:** as páginas são dinâmicas (`private, no-store`, `x-vercel-cache: MISS`) e o header não aparece mais.

- **Feature 5 (Catálogo):** a sessão é lida no header da loja (Feature 1), o que torna
  **toda página da loja dinâmica** — e a página de Produto é justamente o caso perfeito de
  cache de CDN. Decisão emprestada, não definitiva: a Feature 1 a manteve porque hoje não
  existe página que mereça cache (a home está vazia). Ao construir o catálogo, reabrir com
  as duas alternativas já escritas na spec de `auth-core` ("Rotas e telas"): **(b)** header
  neutro com a loja inteira estática, ou **(c)** casca neutra estática + Client Component
  que troca para o nome na hidratação via `authClient.useSession()` — cache preservado e
  nome na tela. A (c) é provavelmente a resposta final.

- **Feature 2 (Auth: segurança da conta):** com `esqueci-a-senha`, `redefinir-senha` e
  `verificar-email`, a loja passa a ter 5 telas de autenticação soltas em `(store)`. É aí
  que um grupo `(store)/(auth)/` com `layout.tsx` próprio (a coluna estreita da `AuthCard`)
  passa a compartilhar algo de verdade. Na Feature 1 foi considerado e adiado: com 2 telas,
  e o cadastro trocando o título no meio do fluxo, o grupo seria só uma pasta a mais.
  `/conta` não entra nele: é a área da pessoa, não autenticação.

- **Feature 2 (Auth: segurança da conta):** o rate limit da Feature 1 conta por
  `${ip}|${path}`, então 100 IPs testam 100× mais senhas na mesma conta. Contar por e-mail é
  possível (o `hooks.before` enxerga `ctx.body.email`), mas foi **adiado de propósito** para
  comparar com o Turnstile, que ataca o mesmo cenário sem contador de concorrência nosso.
  Decidir lá, com as duas opções na mesa.

- ~~**Feature 5 (Catálogo):** `src/app/(store)/loading.tsx` fazia `notFound()` responder 200.~~ **Resolvida na Feature 1 (ticket 08):** o `loading.tsx` do grupo saiu e `notFound()` numa rota da loja voltou a responder 404 (conferido). Ao criar um `loading.tsx` de segmento na Feature 5, lembrar que ele devolve o problema para as páginas abaixo dele.

## Decisões transversais

- **Projeto de portfólio** (decidido em 2026-10-02): repositório público, loja de
  demonstração que nunca vende nem cobra de verdade. A segurança continua sendo feita como
  se fosse real (é a vitrine), mas gateway de pagamento, bancos separados de dev/prod e
  processo completo de LGPD ficam de fora. Como visitantes vão criar conta, o cadastro avisa
  que é demonstração (ticket 15 de `auth-core`).
- **Fim de cada feature: doc de estudo → tag `estudo/<feature>` → dieta de comentários.** A
  `main` fica com comentários curtos de projeto profissional; a versão comentada fica na tag
  e no doc (`~/Documentos/grafite-estudo/`). Ver AGENTS.md.
- Glossário: `CONTEXT.md`. Decisões: `docs/adr/`.
- Stack: Next.js 16, TypeScript strict, pnpm, Biome, shadcn/ui, Prisma + Supabase (só Postgres), better-auth, Zod, react-hook-form, nuqs, Resend, Vitest, Playwright.
- Código e glossário em inglês; UI em pt-BR.
- Imagens de Produto entram na **Feature 4**, depois que o Admin existe (Feature 3) e antes
  do Catálogo (Feature 5), para a vitrine já nascer com imagem em vez de ser retrabalhada.
  Até lá, placeholder `bg-muted` em proporção 3:4 (ver `/design-system`).
- Frete: valor fixo, grátis acima de um limite (constantes).
- Segurança: rate limit, senhas vazadas, mensagens genéricas anti-enumeração, Turnstile, cookies seguros + `trustedOrigins`, autorização por dono (ADR 0003), Zod no servidor, `server-only`, headers de segurança/CSP, proteção de open redirect.
