# 02 - Tema, fonte e tokens visuais

Status: open
Responsável: Claude
Blocked by: 01

## O que

- Inicializar o shadcn/ui e adicionar os componentes base: `button`, `input`, `label`, `sheet`, `skeleton`, `sonner`, `separator`.
- Aplicar os tokens da tabela da spec em `globals.css` (incluindo `--radius: 0`).
- Fonte Hanken Grotesk via `next/font/google` (400 e 500) ligada ao `--font-sans`.
- Base 14px, cor do texto `foreground`, antialiasing.
- Customizar a variante padrão do `Button` para o estilo contornado com hover invertido; manter `ghost` e `link` para ações secundárias.
- Foco visível consistente (`focus-visible` com outline 1px `ring`).
- Componente `Logo` (nome em caixa alta com letter-spacing largo) em `components/layout/`.
- Comentários explicando o que são tokens e por que customizar a variante em vez de passar classes em cada botão.

## Critérios de aceite

- [ ] Botão padrão aparece contornado, reto, invertendo no hover.
- [ ] Navegar com Tab mostra foco em botões e inputs.
- [ ] Nenhuma cor "solta" em hex nos componentes: tudo via tokens.
