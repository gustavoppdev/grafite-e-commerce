# 08 - Página `/entrar`

Status: resolved
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

- [x] Login correto entra e vai para o destino do `?next=` (ou `/conta`), com o header já
      mostrando a conta (`router.refresh()` ou equivalente, senão o header vem do cache).
- [x] Senha errada e e-mail inexistente mostram a mesma mensagem.
- [x] `?next=https://exemplo.invalido` e `?next=//exemplo.invalido` não saem do site.
- [x] Com sessão, abrir `/entrar` redireciona.
- [x] Erro por campo aparece no campo; erro geral em toast; sem repetir a frase nos dois.
- [x] Teclado: Tab alcança tudo na ordem, foco visível, Enter envia.
- [x] Responsivo em ~400px e desktop, sem rolagem horizontal.
- [x] `notFound()` numa rota da loja volta a responder 404 de verdade.
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam.

## Notas

- `autoComplete="email"` e `autoComplete="current-password"`: sem isso o gerenciador de
  senhas não preenche e o usuário escolhe senha pior.
- O botão desabilitado durante o envio evita duplo clique gastando duas tentativas do rate
  limit.
- A mensagem de erro nunca é renderizada como HTML.

## Comments

### 2026-10-01 — Claude: feito

Arquivos: `src/app/(store)/entrar/page.tsx`, `src/features/auth/components/` (`auth-card`,
`auth-field`, `sign-in-form`). Removido `src/app/(store)/loading.tsx`. Extraído
`toFieldErrors` de `failValidation` em `src/lib/action-result.ts`, para o formulário do
`authClient` produzir o mesmo formato de erro das actions.

**Decisões:**

- **Sem react-hook-form** (entra na Feature 3): dois campos, `FormData` + `signInSchema`
  resolvem.
- **`useTransition` assíncrono** para o estado de envio: o botão fica travado até a
  navegação terminar, não só até a resposta. Só o botão trava. Os campos ficam
  habilitados porque o foco volta para a senha ainda dentro da transição, e campo
  desabilitado não recebe foco.
- **Erro de credencial em toast, senha apagada e focada.** A frase não aponta campo (é a
  proteção contra enumeração), então não fica colada em nenhum.
- **Foco no primeiro campo inválido** na validação do navegador.
- **`method="post"` no `<form>`**: se o envio acontecer antes de o JavaScript carregar, o
  padrão GET poria a senha na URL (histórico, logs, `Referer`).
- **`noValidate`**: as mensagens são as do schema, em pt-BR, não os balões do navegador.
- **Timeout de 15s no cliente** (`fetchOptions.timeout`) + `try/catch`: o `fetch` lança
  em rede caída ou tempo esgotado, e sem o `catch` o botão ficaria preso.
- **`safeRedirectPath` duas vezes**: na página (o destino que vai para o formulário) e na
  boca do `router.replace`. A doc do Next avisa que `router.replace` executa
  `javascript:` (XSS); conferir no ponto de uso custa uma regex.
- **`router.replace` + `router.refresh`**: voltar no navegador não cai no login, e as
  partes que leem a sessão são renderizadas de novo. O header ainda não mostra a conta
  (ticket 10); confirmar lá que o `refresh` atualiza o menu.
- **`?next=` viaja para o cadastro** (`/cadastro?next=...`) quando não é o padrão.
- Texto de apoio encurtado ("Acesse sua conta para acompanhar seus pedidos.") porque a
  versão longa quebrava mal.

**Verificação:** `curl` + Chrome headless (Playwright), usuário de teste apagado depois.

| Caso | Resultado |
|---|---|
| Enviar vazio | "Digite seu e-mail." / "Digite sua senha." nos campos, foco no e-mail |
| E-mail `ana@` | "Digite um e-mail válido." |
| Senha errada | toast "E-mail ou senha incorretos.", nenhum erro de campo, senha vazia e focada |
| E-mail inexistente | o mesmo toast, a mesma frase |
| Durante o envio | botão "Entrando..." desabilitado |
| Enter na senha, `?next=/design-system`, e-mail `DEV-08@...` com espaço | entra e vai para `/design-system` (~1,2s com o piso de 800ms) |
| Cookie | `better-auth.session_token`, `HttpOnly`, `SameSite=Lax` |
| Logado abrindo `/entrar` | 307 → `/conta` |
| Logado, `?next=` `https://exemplo.invalido`, `//exemplo.invalido`, `/\exemplo.invalido`, `javascript:alert(1)` | 307 → `/conta` nos quatro |
| Logado, `?next=/conta/pedidos` | 307 → `/conta/pedidos` |
| Tab a partir do e-mail | senha → botão "Entrar" → "Criar conta" |
| Foco visível no botão | contorno sólido de 1px |
| 400px | sem rolagem horizontal (`scrollWidth - innerWidth = 0`) |
| `notFound()` numa rota de `(store)` | **404** (era 200 com o `loading.tsx`) |

`/conta` ainda não existe (ticket 11), então o destino padrão cai no 404 por enquanto.
