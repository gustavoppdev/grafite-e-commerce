"use client";

// Error boundary é Client Component. Não envolve o layout do mesmo nível: header e footer
// ficam na tela.

import Link from "next/link";
import { useEffect } from "react";
import { PageMessage } from "@/components/common/page-message";
import { Button, buttonVariants } from "@/components/ui/button";

export default function StoreError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Em produção a mensagem vem genérica; o erro completo está no log, pelo mesmo `digest`.
    console.error(error);
  }, [error]);

  return (
    <PageMessage
      title="Algo deu errado"
      description="Não conseguimos carregar esta página. Tente novamente em instantes."
    >
      {/* `retry` busca de novo e re-renderiza (falha temporária). */}
      <Button onClick={() => retry()}>Tentar novamente</Button>
      <Link href="/" className={buttonVariants({ variant: "link" })}>
        Voltar para a loja
      </Link>
      {/* O digest não revela nada e acha o registro exato no log. */}
      {error.digest && (
        <p className="text-meta text-muted-foreground">
          Código do erro: {error.digest}
        </p>
      )}
    </PageMessage>
  );
}
