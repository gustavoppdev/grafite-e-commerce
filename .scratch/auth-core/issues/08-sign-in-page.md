# 08 - Página `/entrar`

Status: open
Responsável: Claude
Blocked by: 02, 05, 06, 07

## O que

- `src/app/(store)/entrar/page.tsx` — Server Component: metadata, lê `?next=` com
  `safeRedirectPath` (ticket 02) e, se já há sessão, redireciona.
- `src/features/auth/components/sign-in-form.tsx` — Client Component: `signInSchema`
  (ticket 06), `authClient.signIn.email`, erro traduzido pelo `authError` (ticket 07),
  erro por campo colado no input e erro geral em toast, botão com estado de envio,
  link para `/cadastro`.
- Um componente de casca para as duas telas de auth (título + formulário + rodapé de link),
  reaproveitado no ticket 09.
- **Remover `src/app/(store)/loading.tsx`** (skeleton de grade de produtos aplicado a todo o
  grupo `(store)`; piscaria no login). Registrar no roadmap que a nota da Feature 5 sobre
  `notFound()` responder 200 fica resolvida por isso, e confirmar que 404 volta a ser 404.

Estilo: tokens da Fundação (reto, botão principal contornado de largura total, foco visível),
`/design-system` como referência. Formulário estreito e centrado.

## Critérios de aceite

- [ ] Login correto entra e vai para o destino do `?next=` (ou `/conta`), com o header já
      mostrando a conta (`router.refresh()` ou equivalente, senão o header vem do cache).
- [ ] Senha errada e e-mail inexistente mostram a mesma mensagem.
- [ ] `?next=https://exemplo.invalido` e `?next=//exemplo.invalido` não saem do site.
- [ ] Com sessão, abrir `/entrar` redireciona.
- [ ] Erro por campo aparece no campo; erro geral em toast; sem repetir a frase nos dois.
- [ ] Teclado: Tab alcança tudo na ordem, foco visível, Enter envia.
- [ ] Responsivo em ~400px e desktop, sem rolagem horizontal.
- [ ] `notFound()` numa rota da loja volta a responder 404 de verdade.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam.

## Notas

- `autoComplete="email"` e `autoComplete="current-password"`: sem isso o gerenciador de
  senhas não preenche e o usuário escolhe senha pior.
- O botão desabilitado durante o envio evita duplo clique gastando duas tentativas do rate
  limit.
- A mensagem de erro nunca é renderizada como HTML.

## Comments
