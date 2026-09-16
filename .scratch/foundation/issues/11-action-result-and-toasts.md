# 11 - `ActionResult` e toasts

Status: resolved
Responsável: Claude
Blocked by: 02

## O que

- `src/lib/action-result.ts`: tipo `ActionResult<T>` da spec e helpers `ok(data)` / `fail(error, fieldErrors?)`.
- Helper para converter erro de validação do Zod em `fieldErrors`.
- `<Toaster />` (sonner) no layout raiz, estilizado com os tokens (reto, sem sombra pesada).
- Uma server action de demonstração (em `src/features/demo/` ou junto ao `/design-system`) que valida um input com Zod e retorna sucesso ou erro, e um exemplo de consumo mostrando toast conforme o resultado.
- Comentários explicando: por que retornar resultado em vez de lançar erro, o que nunca deve ir na mensagem de erro, e que toda action valida a entrada no servidor mesmo com validação no cliente.

## Critérios de aceite

- [x] Action de demo retorna `{ ok: false, fieldErrors }` para entrada inválida e `{ ok: true }` para válida.
- [x] Toast de sucesso e de erro aparecem com o estilo da loja.
- [x] O TypeScript obriga a checar `ok` antes de acessar `data`.

## Comments

Entregue em `src/lib/action-result.ts` (`ActionResult<T>`, `ok`, `fail`, `failValidation`),
`src/features/demo/` (schema, action e `NewsletterForm`) e `<Toaster />` no layout raiz.

Decisões:

- `failValidation` percorre `error.issues` em vez de usar `z.flattenError`: sem cast de tipo
  e o código mostra de onde vem cada `fieldError`. Issue sem `path` (regra de objeto inteiro)
  vira mensagem geral, não erro de campo.
- Erro de campo aparece colado no input; erro geral vira toast. A `NewsletterForm` não mostra
  toast quando há `fieldErrors`, para não repetir a mesma frase em dois lugares.
- `src/components/ui/sonner.tsx` tinha `classNames: { toast: "cn-toast" }`, classe que não
  existia em lugar nenhum (sobra do gerador do shadcn). Trocada por estilo com os tokens.
- Para o ticket 11 ser verificável, `src/app/design-system/page.tsx` nasceu aqui com a seção
  de toast e o 404 em produção. As outras 5 seções são do ticket 03.

Verificado: `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam; no navegador o
erro de campo, o erro geral em toast e o sucesso em toast aparecem, sem erro no console;
em `pnpm start` a rota `/design-system` responde 404 com `noindex`.
