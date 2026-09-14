# 05 - Footer da loja

Status: resolved
Responsável: Claude
Blocked by: 04

## O que

Footer minimalista no layout `(store)`, no estilo da referência:

- Bloco da marca: `Logo` + descrição curta.
- Colunas de links em 13px e cor `muted-foreground`: **Loja** (as mesmas categorias do header) e **Conta** (Entrar, Meus pedidos, Carrinho).
- Sem coluna de "Ajuda": não existem páginas de frete, trocas ou contato no escopo (ADR 0001), e links mortos não entram.
- Linha final com `© <ano atual> <nome da loja>` e o aviso "Loja fictícia para fins de estudo. Nenhum pagamento real é processado."
- Linha fina no topo do footer.

## Critérios de aceite

- [ ] Em ~400px as colunas empilham; no desktop ficam lado a lado.
- [ ] O ano é calculado, não fixo no código.
- [ ] Nome e categorias vêm de `siteConfig` e `categoryLinks`, não escritos à mão.
- [ ] É um Server Component, com cada grupo de links num `<nav>` rotulado.
- [ ] O footer fica no fim da tela mesmo com pouco conteúdo.
