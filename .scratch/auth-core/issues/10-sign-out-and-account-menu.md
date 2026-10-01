# 10 - Sair: action de logout e menu da conta no header

Status: resolved
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

- [x] Deslogado: ícone/link "Entrar". Logado: nome e menu. Admin: item "Administração".
- [x] Sair limpa o cookie, volta para a home e o header volta a mostrar "Entrar" na hora.
- [x] O header não trava esperando a sessão (fallback do Suspense aparece; sem salto de layout).
- [x] Nenhum dado além de nome e papel chega ao Client Component do menu.
- [x] Mobile: as mesmas opções no `Sheet`, alcançáveis por teclado.
- [x] `pnpm lint`, `pnpm typecheck` e `pnpm build` passam.

## Notas

- Ler a sessão no header torna as páginas da loja **dinâmicas**. É proteção, não regressão:
  página com o nome de uma pessoa no cache da CDN seria servida para a próxima visitante.
  Deixar isso escrito no comentário do componente — é a pergunta que alguém vai fazer.
- "Administração" no menu é conveniência de UI. Quem barra o acesso é o `requireAdmin()`.

## Comments

### 2026-10-01 — Claude: feito

Arquivos: `src/features/auth/actions.ts` (`signOutAction`),
`src/components/layout/account-menu.tsx` (Server: `AccountMenu`, `AccountMenuFallback`,
`MobileAccountLinks`), `src/components/layout/account-dropdown.tsx` (Client), o
`dropdown-menu` do shadcn (Base UI), e mudanças em `site-header.tsx`, `mobile-nav.tsx` e
`navigation.ts`.

**Decisões:**

- **Ícone de conta só no desktop**; no celular as opções ficam no menu lateral, como a spec
  pede. O gatilho é só ícone (o nome aparece dentro do menu): o fallback do `<Suspense>` é o
  mesmo ícone, do mesmo tamanho, e nada pula quando a sessão chega. O fallback não mostra
  "Entrar" porque, para quem está logado, seria mentira por um instante.
- **Para o Client Component só vão `name` e `isAdmin`.** Conferido: o HTML da página
  logada não contém nem o e-mail nem o id do usuário.
- **Form de sair FORA do popup**, enviado pelo item com `form={id}`: o popup é desmontado
  ao fechar e levaria o `<form>` junto.
- **`MobileNav` recebe a parte da conta pronta do servidor** (`account`, dentro de
  `<Suspense>`), sem conhecer a sessão. Para fechar o menu ao clicar em qualquer link,
  inclusive esses que chegam do servidor sem `onClick`, um único `onClick` no contêiner
  observa cliques em `<a>`.
- **`signOut` sem `try/catch`**: conferido em `sign-out.mjs`, sem sessão ele não lança. Se o
  banco falhar ao apagar a sessão, a biblioteca só registra o erro e apaga o cookie mesmo
  assim. Para o doc de estudo: nesse caso a sessão continua válida no banco até expirar.
- **`accountLinks` do footer**: Entrar, Criar conta, Minha conta. O footer não lê a sessão;
  "Meus pedidos" saiu porque a rota só existe na Feature 9.
- **Páginas agora dinâmicas**: `/`, `/entrar`, `/cadastro` e a 404 (usa o `StoreShell`)
  passaram de `○` para `ƒ` no build, como previsto. O `/design-system` também: em produção
  ele chama `notFound()`, e a 404 que ele renderiza tem o header que lê a sessão.

**Verificação** (Chrome headless; usuário de teste apagado):

| Caso | Resultado |
|---|---|
| Visitante, desktop | ícone "Entrar" → `/entrar` |
| Login pelo formulário, `?next=/` | header mostra "Minha conta" **sem recarregar a página** (o `router.refresh()` do ticket 08 funciona) |
| Menu de Cliente | nome, Minha conta, Sair |
| Mesmo usuário promovido a admin no banco | nome, Minha conta, Administração, Sair |
| Teclado | Enter abre, setas chegam em Sair, Enter sai |
| Depois de Sair | volta para `/`, header com "Entrar", cookie de sessão apagado, sessão apagada no banco |
| Celular, visitante | menu lateral com Entrar e Criar conta; fecha ao clicar num link |
| Celular, logado | nome, Minha conta, Administração, Sair; Sair alcançável por Tab e funciona |
| HTML bruto da home | fallback presente e marcador de Suspense pendente (`<!--$?-->`): o header sai antes da sessão |
