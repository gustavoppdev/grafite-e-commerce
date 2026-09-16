# 03 - Página `/design-system`

Status: resolved
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

- [x] Todas as 6 seções aparecem e ficam boas em ~400px e no desktop.
- [x] Nenhuma cor em hex no JSX: só classes de token.
- [x] Em `pnpm build && pnpm start`, `/design-system` dá 404.

## Comments

O arquivo `src/app/design-system/page.tsx` já existe desde o ticket 11, com a seção 6 (toast)
e o 404 em produção prontos. Falta só acrescentar as seções 1 a 5.

As cinco seções restantes entraram agora, em `src/app/design-system/page.tsx`.

**Classes de cor escritas por extenso.** O Tailwind varre o código procurando nomes de
classe como TEXTO; ele não executa nada. Uma classe montada em runtime não existe em arquivo
nenhum e o CSS correspondente nunca é gerado — o quadrado sairia transparente. Por isso a
lista `colorTokens` repete `bg-background`, `bg-foreground`... em vez de derivar do nome do
token. Registrado em comentário porque é a pegadinha que mais aparece com Tailwind.

**Bloco de Produto** ficou local ao arquivo: é a forma visual para acertar proporção e
espaçamento, não o componente de verdade. Ele nasce em `src/features/products/` na Feature 4,
e usa a mesma `aspect-3/4` do `ProductGridSkeleton` para a grade não pular quando os dados
chegarem. Esgotado usa os dois tokens conforme a spec: nome e preço riscado em
`subtle-foreground`, etiqueta em `muted-foreground`.

**Campo com erro** leva `aria-invalid` mais `aria-describedby` apontando para a mensagem,
e a mensagem tem `role="alert"`. A cor sozinha não pode carregar a informação.

Verificado: 6 seções em ~420px e no desktop, nenhum hex em `src/app`, `src/components` ou
`src/features`, console sem erro em dev, e `/design-system` responde 404 em `pnpm start`.
