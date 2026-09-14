# 11 - `ActionResult` e toasts

Status: open
Responsável: Claude
Blocked by: 02

## O que

- `src/lib/action-result.ts`: tipo `ActionResult<T>` da spec e helpers `ok(data)` / `fail(error, fieldErrors?)`.
- Helper para converter erro de validação do Zod em `fieldErrors`.
- `<Toaster />` (sonner) no layout raiz, estilizado com os tokens (reto, sem sombra pesada).
- Uma server action de demonstração (em `src/features/demo/` ou junto ao `/design-system`) que valida um input com Zod e retorna sucesso ou erro, e um exemplo de consumo mostrando toast conforme o resultado.
- Comentários explicando: por que retornar resultado em vez de lançar erro, o que nunca deve ir na mensagem de erro, e que toda action valida a entrada no servidor mesmo com validação no cliente.

## Critérios de aceite

- [ ] Action de demo retorna `{ ok: false, fieldErrors }` para entrada inválida e `{ ok: true }` para válida.
- [ ] Toast de sucesso e de erro aparecem com o estilo da loja.
- [ ] O TypeScript obriga a checar `ok` antes de acessar `data`.
