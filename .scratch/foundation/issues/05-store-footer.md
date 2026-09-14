# 05 - Footer da loja

Status: open
Responsável: Gustavo
Blocked by: 04

## O que

Footer minimalista no layout `(store)`, no estilo da referência:

- Colunas de links em texto pequeno (13px) e cor `muted-foreground`: **Loja** (categorias de exemplo), **Ajuda** (Frete, Trocas, Contato) e **Conta** (Entrar, Meus pedidos). Os links podem apontar para `#` por enquanto.
- Linha final com `© <ano atual> <nome da loja>` e um aviso curto: "Loja fictícia para fins de estudo".
- Separador fino no topo.

## Critérios de aceite

- [ ] Em ~400px as colunas empilham; no desktop ficam lado a lado.
- [ ] O ano é calculado, não fixo no código.
- [ ] O nome vem do `siteConfig`, não escrito à mão.
- [ ] É um Server Component (sem `"use client"`).

## Guia

- **Onde se inspirar:** `components/layout/site-header.tsx` (ticket 04). Siga a mesma organização: arquivo em `components/layout/`, uso do `Container`, `<nav aria-label="...">` para cada grupo de links.
- **Semântica:** use a tag `<footer>`. Cada coluna é um grupo de links: pense em qual combinação de tags representa "título + lista de links" (dica: listas de verdade ajudam leitores de tela a anunciar "lista, 3 itens").
- **Dados vs. JSX:** em vez de repetir `<li><Link>` várias vezes, declare as colunas como um array de objetos e faça `.map()`. Assim, na Feature 4, trocar as categorias de exemplo por dados reais muda um lugar só.
- **Responsivo:** grid com 1 coluna no mobile e 3 no desktop. Consulte os breakpoints do Tailwind.
- **Onde colocar:** no `src/app/(store)/layout.tsx`, depois do conteúdo. Se a página tiver pouco conteúdo, o footer sobe até o meio da tela. Como fazer ele ficar sempre embaixo? (Dica: flexbox em coluna com altura mínima da tela, e o `main` crescendo.)
- **Armadilha:** o separador pode ser o componente `Separator` do shadcn ou uma borda no topo. Escolha um e justifique no commit.
