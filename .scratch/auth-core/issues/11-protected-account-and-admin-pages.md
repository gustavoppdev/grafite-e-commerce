# 11 - `/conta` e `/admin` protegidas

Status: resolved
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

- [x] `/conta` deslogado → `/entrar`; logado → mostra os dados da própria pessoa.
- [x] `/admin` como Visitante e como Cliente → 404 (o `not-found.tsx` da loja).
- [x] `/admin` como Admin → abre.
- [x] Renomear `proxy.ts` (que ainda não existe neste ticket, e por isso ele é o melhor
      momento para provar isso) e as duas rotas continuam protegidas.
- [x] `pnpm lint`, `pnpm typecheck` e `pnpm build` passam.

## Comments

### 2026-10-01 — Claude: feito, e a verificação achou um vazamento no payload

Arquivos: `src/app/(store)/conta/page.tsx`, `src/app/(admin)/layout.tsx`,
`src/app/(admin)/admin/page.tsx`. `requireAdmin` passou a usar `cache()` em
`src/server/session.ts`.

**`/conta`**: `requireUser()` na página, nome e e-mail da própria pessoa (da sessão, nunca
de um id na URL), botão Sair, `robots: { index: false }`. Sem `layout.tsx` de segmento por
enquanto; a Feature 7 cria quando houver o que compartilhar.

**O vazamento.** Primeira versão: layout de `(admin)` sem checagem (como a spec dizia) e
`metadata` fixo com `title: "Administração"`. Visitante e Cliente recebiam 404, mas o HTML
dessa 404 trazia, no payload RSC, a casca renderizada pelo layout ("Administração") e o
título "Administração | GRAFITE". A 404 de uma URL inexistente não trazia. Confirmado também
no build de produção, não só no modo dev. É o aviso da doc do Next: o layout roda em paralelo
e o resultado vai no payload mesmo quando a página recusa.

**Correção:**
- O layout também chama `requireAdmin()` **antes** de renderizar a casca. Não é a proteção
  (cada página continua chamando, porque o layout não roda de novo a cada navegação); é para
  a interface de admin nunca ser renderizada para quem não é Admin.
- Título via `generateMetadata`, que chama `requireAdmin()` antes de devolver.
- `requireAdmin` em `cache()`: layout + metadata + página = uma checagem e **uma** linha de
  log (o `cache()` guarda também o erro lançado pelo `notFound()`).

**Nuance registrada na spec:** a 404 de `/admin` ainda difere estruturalmente da de uma URL
inexistente (`<html id="__next_error__">`, ~17 KB contra ~37 KB: o Next renderiza o
`notFound()` lançado de um layout por outro caminho). E o link `href:"/admin"` está no JS do
menu da conta, que todo visitante baixa. Ou seja, o 404 não esconde que a rota existe, só não
anuncia. O que importa é que nenhuma interface de admin chegue a quem não é Admin. Na
Feature 3 a casca vai ter navegação e talvez contadores, e eles não podem vazar.

**Verificação** (build de produção, `curl` + Chrome headless; usuários apagados):

| Caso | Resultado |
|---|---|
| `/conta` Visitante | 307 → `/entrar` |
| `/conta` Cliente | 200, o próprio nome e e-mail, nada do outro usuário |
| `/admin` Visitante | 404, título "Página não encontrada", nenhum "Administração" no HTML |
| `/admin` Cliente | 404, idem + **uma** linha `[auth] requireAdmin recusou o usuário <id>` |
| `/admin` Admin | 200, "Olá, Admin Onze", título "Administração \| GRAFITE" |
| Visual da 404 de `/admin` | igual à 404 normal (header, footer, "Voltar para a loja") |
| Sem `proxy.ts` (ainda não existe) | as duas rotas protegidas: a defesa é a página |
| 400px | sem rolagem horizontal |

Login em produção local na porta 3001 recebeu 403: o `trustedOrigins` só aceita a origem do
`BETTER_AUTH_URL` (`:3000`). A checagem de origem funcionando, de brinde.
