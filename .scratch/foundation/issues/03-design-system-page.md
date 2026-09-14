# 03 - Página `/design-system`

Status: open
Responsável: Claude
Blocked by: 02, 11

## O que

Uma página interna que mostra todos os elementos visuais da loja num lugar só, servindo de referência viva durante o projeto. Fica fora do grupo `(store)` (sem header/footer).

Seções:
1. **Tipografia:** texto base (14px), metadado (13px), logo, link.
2. **Cores:** um quadrado para cada token da spec com o nome do token embaixo.
3. **Botões:** padrão, `outline`, `ghost`, `link`, `destructive`, desabilitado, largura total.
4. **Campos:** `Label` + `Input` normal, com erro (texto em `destructive`) e desabilitado.
5. **Bloco de Produto:** placeholder `bg-muted` em proporção retrato, nome e preço embaixo na mesma linha, e uma versão com "Esgotado".
6. **Toast:** botão que chama a action de demonstração do ticket 11 e mostra toast de sucesso ou erro. Só esse botão é client component.

A página deve responder **404 em produção**.

## Critérios de aceite

- [ ] Todas as 6 seções aparecem e ficam boas em ~400px e no desktop.
- [ ] Nenhuma cor em hex no JSX: só classes de token.
- [ ] Em `pnpm build && pnpm start`, `/design-system` dá 404.
