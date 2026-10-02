import type { Metadata } from "next";
import Link from "next/link";
import { PageMessage } from "@/components/common/page-message";
import { StoreShell } from "@/components/layout/store-shell";
import { buttonVariants } from "@/components/ui/button";

// Na raiz: cobre URL inexistente (renderizada fora de qualquer grupo) e `notFound()` das
// páginas da loja. Por isso traz o `StoreShell`.

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
