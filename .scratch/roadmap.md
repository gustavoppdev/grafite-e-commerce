# Roadmap

Cada feature é entregável sozinha e vai para produção (Vercel) ao terminar. Spec em `.scratch/<feature-slug>/spec.md`, tickets em `.scratch/<feature-slug>/issues/NN-<slug>.md`.

| # | Feature | Slug | Aprendizado principal | Status |
|---|---|---|---|---|
| 0 | Fundação | `foundation` | Next 16, pnpm, Biome, shadcn + direção visual, Prisma + Supabase, env com Zod, error/loading/not-found, padrão de resultado das actions, toasts, headers de segurança, Vitest, deploy | falta só o deploy (ticket 15) |
| 1 | Auth: essencial | `auth-core` | better-auth, cadastro/login/logout, plugin admin (papéis `user`/`admin`), script do primeiro Admin, `proxy.ts`, `requireUser`/`requireAdmin`, rate limit (no banco, mais rígido em rotas sensíveis) | pendente |
| 2 | Auth: segurança da conta | `auth-hardening` | Resend + React Email, verificação de e-mail, recuperação de senha, senhas vazadas (HIBP), Turnstile, sessões ativas, derrubar sessões ao trocar senha | pendente |
| 3 | Admin: Categorias e Produtos | `admin-catalog` | CRUD, RHF + Zod, Slug, arquivamento, tabela paginada, seed | pendente |
| 4 | Catálogo | `storefront-catalog` | Server Components, `nuqs`, busca/filtros/ordenação/paginação na URL, Esgotado, metadata/SEO | pendente |
| 5 | Carrinho | `cart` | Server actions, UI otimista, revalidação de cache, redirect pós-login seguro | pendente |
| 6 | Minha conta: Perfil e Endereços | `account-addresses` | ViaCEP, Endereço padrão | pendente |
| 7 | Checkout e Pagamento | `checkout` | Transação + concorrência de Estoque, revalidação de preço/estoque, snapshots, Frete, cartão (Luhn + cartões de teste), Número do pedido | pendente |
| 8 | Pedidos do cliente | `customer-orders` | Histórico, detalhe, Cancelamento (máquina de estados), checagem de dono (IDOR) | pendente |
| 9 | Admin: Pedidos, Usuários e Dashboard | `admin-operations` | Transições de status, banir Cliente, Faturamento, Estoque baixo, agregações | pendente |
| 10 | Fechamento | `wrap-up` | Playwright (cadastro → compra), revisão final de segurança | pendente |

## Notas para features futuras

- **Feature 4 (Catálogo):** `src/app/(store)/loading.tsx` faz toda página da loja responder em streaming, então `notFound()` (ex. Produto inexistente ou arquivado) devolve HTTP 200 + `noindex` em vez de 404. Ao criar as rotas de produto, mover o `loading.tsx` para a listagem e decidir se a página de Produto precisa de 404 real (verificado na Feature 0, ticket 07).

## Decisões transversais

- Glossário: `CONTEXT.md`. Decisões: `docs/adr/`.
- Stack: Next.js 16, TypeScript strict, pnpm, Biome, shadcn/ui, Prisma + Supabase (só Postgres), better-auth, Zod, react-hook-form, nuqs, Resend, Vitest, Playwright.
- Código e glossário em inglês; UI em pt-BR.
- Sem imagens de Produto: placeholder `bg-neutral-100`.
- Frete: valor fixo, grátis acima de um limite (constantes).
- Segurança: rate limit, senhas vazadas, mensagens genéricas anti-enumeração, Turnstile, cookies seguros + `trustedOrigins`, autorização por dono (ADR 0003), Zod no servidor, `server-only`, headers de segurança/CSP, proteção de open redirect.
