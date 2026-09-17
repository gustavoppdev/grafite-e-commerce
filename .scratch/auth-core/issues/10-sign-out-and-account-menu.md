# 10 - Sair: action de logout e menu da conta no header

Status: open
Responsável: Claude
Blocked by: 05

## O que

- `src/features/auth/actions.ts` — `signOutAction`: server action que chama
  `auth.api.signOut` (o plugin `nextCookies()` limpa o cookie) e faz `redirect("/")`.
  É a **única** operação de auth por server action; o comentário explica por quê (sair não
  precisa de rate limit e um `<form>` funciona sem JavaScript).
- `src/components/layout/account-menu.tsx` — Server Component que lê `getSession()`:
  sem sessão, um link "Entrar" (ícone de pessoa); com sessão, menu com o nome, links para
  `/conta`, "Administração" só para Admin, e o botão Sair dentro de um `<form>`.
- `site-header.tsx`: o menu entra à direita, ao lado do carrinho, **dentro de `<Suspense>`**
  com um fallback do mesmo tamanho, para o resto do header não esperar o banco.
- `mobile-nav.tsx`: as mesmas opções no menu lateral.
- Atualizar `accountLinks` em `navigation.ts` conforme as rotas reais.

## Critérios de aceite

- [ ] Deslogado: ícone/link "Entrar". Logado: nome e menu. Admin: item "Administração".
- [ ] Sair limpa o cookie, volta para a home e o header volta a mostrar "Entrar" na hora.
- [ ] O header não trava esperando a sessão (fallback do Suspense aparece; sem salto de layout).
- [ ] Nenhum dado além de nome e papel chega ao Client Component do menu.
- [ ] Mobile: as mesmas opções no `Sheet`, alcançáveis por teclado.
- [ ] `pnpm lint`, `pnpm typecheck` e `pnpm build` passam.

## Notas

- Ler a sessão no header torna as páginas da loja **dinâmicas**. É proteção, não regressão:
  página com o nome de uma pessoa no cache da CDN seria servida para a próxima visitante.
  Deixar isso escrito no comentário do componente — é a pergunta que alguém vai fazer.
- "Administração" no menu é conveniência de UI. Quem barra o acesso é o `requireAdmin()`.

## Comments
