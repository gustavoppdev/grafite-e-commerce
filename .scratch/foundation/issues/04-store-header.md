# 04 - Header da loja

Status: resolved
Responsável: Claude
Blocked by: 02

## O que

- Grupo de rotas `src/app/(store)/` com `layout.tsx` e `page.tsx` (home vazia, só um título de boas-vindas).
- `components/layout/container.tsx`: largura máxima e padding lateral padrão.
- `components/layout/site-header.tsx` conforme a spec: logo, categorias de exemplo, ícones de busca e carrinho (links sem funcionalidade ainda), menu mobile com `Sheet`.
- Header como Server Component; só o menu mobile é client.
- Acessibilidade: `<header>`, `<nav aria-label>`, ícones com `aria-label`/`sr-only`, link "Pular para o conteúdo".
- Comentários explicando grupos de rotas `(store)` e a divisão server/client.

## Critérios de aceite

- [ ] Desktop: categorias visíveis. Mobile (~400px): hambúrguer abre o menu lateral.
- [ ] Todos os links alcançáveis por teclado, com foco visível.
- [ ] Sem `"use client"` no header inteiro.
