# 07 - `not-found.tsx` e `loading.tsx`

Status: open
Responsável: Gustavo
Blocked by: 06

## O que

1. **404 da loja:** página "Página não encontrada" com texto curto e link "Voltar para a loja", com header e footer visíveis.
2. **Loading da loja:** `loading.tsx` com **skeleton** que imita o layout que vai existir na listagem (título + grid de blocos de Produto), não um spinner.

## Critérios de aceite

- [ ] Acessar `/qualquer-coisa-inexistente` mostra o 404 com header/footer.
- [ ] O status HTTP da resposta é 404 (conferir no DevTools → Network).
- [ ] Skeleton usa o componente `Skeleton` do shadcn e tokens (`bg-muted`), com o mesmo grid do bloco de Produto do `/design-system`.
- [ ] Skeleton visível ao simular uma página lenta (depois remova a simulação).

## Guia

- **Onde se inspirar:** `src/app/(store)/error.tsx` (ticket 06), com o mesmo tom de texto e o mesmo layout centralizado.
- **Pergunta antes de codar:** o `error.tsx` precisou de `"use client"`. O `not-found.tsx` precisa? Por quê? (Pense em quem precisa de interatividade: o botão "Tentar novamente" chama uma função.)
- **Onde colocar o `not-found.tsx`:** teste colocando dentro de `(store)` e acessando uma URL inexistente. Ele aparece? Leia na documentação do Next como o `not-found.tsx` da **raiz** e o de um **segmento** se comportam para URLs que não batem com nenhuma rota. Esse é o ponto do ticket onde mais gente trava. Descreva no commit o que você descobriu.
- **Como simular lentidão:** numa página de teste, um Server Component `async` que espera alguns segundos antes de renderizar (`await new Promise(...)`).
- **`loading.tsx` e Suspense:** o `loading.tsx` é um atalho para um `<Suspense>` em volta da página. Lembre disso na Feature 4, quando formos usar Suspense em partes menores da tela.
- **Armadilha:** o skeleton deve ter proporções parecidas com o conteúdo real, senão a tela "pula" quando o conteúdo carrega (layout shift).
