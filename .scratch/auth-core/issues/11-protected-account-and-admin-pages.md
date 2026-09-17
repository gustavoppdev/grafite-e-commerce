# 11 - `/conta` e `/admin` protegidas

Status: open
Responsável: Claude
Blocked by: 05

## O que

As duas áreas fechadas, mínimas, para a autorização existir e ser verificável. O conteúdo de
verdade é das Features 3 e 7.

- `src/app/(store)/conta/page.tsx` — `requireUser()`, mostra nome e e-mail da pessoa e um
  botão Sair. Layout próprio do segmento se ajudar a Feature 7.
- `src/app/(admin)/admin/page.tsx` + `src/app/(admin)/layout.tsx` — `requireAdmin()`, casca
  mínima (fora de `(store)`, sem header da loja), com link de volta para a loja.
- A checagem fica **na página**, não no layout: layout não re-renderiza a cada navegação e
  não controla se o resto da rota roda (ver a doc do Next em
  `node_modules/next/dist/docs/01-app/02-guides/authentication.md`, seção "Layouts and auth
  checks"). Comentário explicando isso nos dois lugares.

## Critérios de aceite

- [ ] `/conta` deslogado → `/entrar`; logado → mostra os dados da própria pessoa.
- [ ] `/admin` como Visitante e como Cliente → 404 (o `not-found.tsx` da loja).
- [ ] `/admin` como Admin → abre.
- [ ] Renomear `proxy.ts` (que ainda não existe neste ticket, e por isso ele é o melhor
      momento para provar isso) e as duas rotas continuam protegidas.
- [ ] `pnpm lint`, `pnpm typecheck` e `pnpm build` passam.

## Comments
