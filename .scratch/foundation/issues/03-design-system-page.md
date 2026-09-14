# 03 - Página `/design-system`

Status: open
Responsável: Gustavo
Blocked by: 02, 11

## O que

Uma página interna que mostra todos os elementos visuais da loja num lugar só, servindo de referência viva durante o projeto.

Seções:
1. **Tipografia:** texto base (14px), metadado (13px), logo, link.
2. **Cores:** um quadrado para cada token da spec com o nome do token embaixo.
3. **Botões:** padrão, `ghost`, `link`, desabilitado, largura total.
4. **Campos:** `Label` + `Input` normal, com erro (texto em `destructive`) e desabilitado.
5. **Bloco de Produto:** placeholder `bg-muted` em proporção retrato, nome e preço embaixo na mesma linha, e uma versão com "Esgotado".
6. **Toast:** botão que chama a action de demonstração do ticket 11 e mostra toast de sucesso ou erro.

A página deve responder **404 em produção**.

## Critérios de aceite

- [ ] Todas as 6 seções aparecem e ficam boas em ~400px e no desktop.
- [ ] Nenhuma cor em hex no JSX: só classes de token (`bg-muted`, `text-muted-foreground`...).
- [ ] Em `pnpm build && pnpm start`, `/design-system` dá 404.

## Guia

- **Onde criar:** `src/app/design-system/page.tsx`. Ela fica **fora** do grupo `(store)`, então não herda header/footer. É de propósito.
- **Onde se inspirar:** o ticket 02 (tokens em `globals.css` e variantes do `Button`) e o ticket 11 (como chamar uma action e tratar o `ActionResult`).
- **404 em produção:** o Next tem uma função que renderiza a página de não encontrado, importada de `next/navigation`. Pense em **qual variável** diz se o app está em produção e **onde** chamar a função (antes de renderizar qualquer coisa).
- **Toast:** a seção 6 precisa de interatividade (clique), mas o resto da página não. Em vez de marcar a página inteira com `"use client"`, crie **um componente client pequeno** só para o botão. Pergunta para você responder antes de codar: por que isso é melhor?
- **Proporção retrato:** o Tailwind tem utilitário de `aspect-ratio`. A The Row usa algo perto de 2:3 ou 3:4.
- **Esgotado:** posicione o texto dentro do bloco, no canto. `relative` no bloco e `absolute` no texto.
- **Armadilha:** não copie as classes do bloco de Produto em vários lugares. Se ele vai ser reaproveitado na Feature 4, onde deveria morar? (Dica: ainda não existe a feature de catálogo; tudo bem deixar dentro da página por enquanto e mover depois. Só anote a decisão.)
