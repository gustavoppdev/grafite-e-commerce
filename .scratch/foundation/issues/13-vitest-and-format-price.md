# 13 - Vitest e `formatPrice`

Status: open
Responsável: Claude
Blocked by: 01

## O que

- Configurar Vitest com o alias `@/*` e script `pnpm test` (e `test:watch`).
- `src/lib/format.ts`: `formatPrice(cents: number): string` em BRL via `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`.
- `src/lib/format.test.ts` com **um** teste de exemplo (caso comum), estruturado em `describe`/`it` e no padrão arrange/act/assert.
- Comentários explicando por que dinheiro é inteiro em centavos (erros de ponto flutuante como `0.1 + 0.2`).

## Critérios de aceite

- [ ] `pnpm test` roda e passa.
- [ ] `formatPrice(123456)` retorna o valor formatado de R$ 1.234,56.
