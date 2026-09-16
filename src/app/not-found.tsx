import type { Metadata } from "next";
import Link from "next/link";
import { PageMessage } from "@/components/common/page-message";
import { StoreShell } from "@/components/layout/store-shell";
import { buttonVariants } from "@/components/ui/button";

/*
  Por que na RAIZ e não em (store)/not-found.tsx?

  - URL que não bate com nenhuma rota (`/qualquer-coisa`): o Next usa o not-found.tsx
    da raiz, renderizado dentro do layout raiz, mas FORA de qualquer grupo como (store).
    Um (store)/not-found.tsx nunca seria usado nesse caso.
  - `notFound()` chamado numa página da loja (ex. produto inexistente): o Next procura
    o not-found.tsx mais próximo subindo a árvore. Sem um em (store), chega neste aqui.

  Um arquivo só cobre os dois casos. O <StoreShell> traz header e footer, já que o
  layout de (store) não está em volta desta página.
*/

export const metadata: Metadata = {
  title: "Página não encontrada",
};

export default function NotFound() {
  return (
    <StoreShell>
      <PageMessage
        title="Página não encontrada"
        description="O endereço pode estar errado ou a página não existe mais."
      >
        <Link href="/" className={buttonVariants()}>
          Voltar para a loja
        </Link>
      </PageMessage>
    </StoreShell>
  );
}
