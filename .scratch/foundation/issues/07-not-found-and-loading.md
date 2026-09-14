# 07 - `not-found.tsx` e `loading.tsx`

Status: open
Responsável: Claude
Blocked by: 06

## O que

1. **404 da loja:** "Página não encontrada", texto curto e link "Voltar para a loja", no visual da loja (não o 404 escuro padrão do Next). Investigar e explicar nos comentários como o `not-found.tsx` da raiz e o de um segmento se comportam para URLs que não batem com nenhuma rota.
2. **Loading da loja:** `loading.tsx` com skeleton que imita o layout da futura listagem (título + grid de blocos de Produto), não um spinner.

## Critérios de aceite

- [ ] Acessar `/qualquer-coisa-inexistente` mostra o 404 no visual da loja.
- [ ] O status HTTP da resposta é 404.
- [ ] Skeleton usa `Skeleton` do shadcn e tokens, com proporções parecidas com o conteúdo real (sem layout shift).
- [ ] Skeleton visível ao simular uma página lenta (simulação removida antes do commit).
