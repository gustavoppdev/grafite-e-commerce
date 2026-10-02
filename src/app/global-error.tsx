"use client";

// Substitui o layout raiz quebrado: monta `<html>`/`<body>` e traz CSS e fonte por conta
// própria. Client Component, então o título vai num `<title>`.

import { useEffect } from "react";
import { PageMessage } from "@/components/common/page-message";
import { Button, buttonVariants } from "@/components/ui/button";
import { fontSans } from "./fonts";
import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR" className={`${fontSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <title>Erro | GRAFITE</title>
        <PageMessage
          title="Algo deu errado"
          description="O site encontrou um problema inesperado. Tente novamente em instantes."
        >
          <Button onClick={() => retry()}>Tentar novamente</Button>
          {/* `<a>`: com o layout raiz quebrado, recarregar tudo é mais seguro que navegar. */}
          <a href="/" className={buttonVariants({ variant: "link" })}>
            Voltar para a página inicial
          </a>
          {error.digest && (
            <p className="text-meta text-muted-foreground">
              Código do erro: {error.digest}
            </p>
          )}
        </PageMessage>
      </body>
    </html>
  );
}
