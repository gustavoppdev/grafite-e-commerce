# 01 - Criar o projeto e ferramentas

Status: resolved
Responsável: Claude
Blocked by: -

## O que

- Criar o app Next.js com `create-next-app` (TypeScript, App Router, Tailwind, `src/`, alias `@/*`, Biome, pnpm) na raiz do repositório.
- TypeScript `strict` (e `noUncheckedIndexedAccess`).
- Scripts: `dev`, `build`, `start`, `lint` (Biome check), `format` (Biome format), `typecheck` (`tsc --noEmit`).
- Criar a estrutura de pastas da spec (`components/layout`, `features`, `lib`) e `src/lib/site.ts` com `siteConfig` (nome: GRAFITE).
- `.gitignore` cobrindo `.env*` exceto `.env.example`.
- `<html lang="pt-BR">`, metadata base com o nome da loja.
- Instalar `server-only` e `zod`.
- Primeiro commit.

## Critérios de aceite

- [ ] `pnpm dev` abre a página inicial.
- [ ] `pnpm lint`, `pnpm typecheck` e `pnpm build` passam.
- [ ] Estrutura de pastas igual à spec.
