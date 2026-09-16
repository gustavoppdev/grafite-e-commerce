/*
  Este arquivo existe só para o CLI do shadcn.

  O `components.json` aponta `aliases.utils` para cá, e todo componente que o
  `shadcn add` gera importa `cn` de `@/lib/utils`. Nosso código importa direto do
  pacote `cn`, então nada no projeto usa este caminho hoje — mas apagá-lo quebraria
  o próximo componente gerado.
*/
export { cn } from "cn";
