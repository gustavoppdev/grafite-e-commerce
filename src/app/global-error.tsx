"use client";

/*
  Último recurso: aparece quando o próprio layout raiz quebra. Como ele SUBSTITUI o
  layout raiz, precisa montar o documento inteiro (<html>, <body>) e trazer por conta
  própria o CSS global e a fonte. Nada do layout normal existe aqui, nem header.

  Por ser Client Component, não aceita `export const metadata`; o título vai com
  a tag <title>, que o React posiciona no <head>.
*/

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
          {/*
            <a> em vez de <Link> de propósito: com o layout raiz quebrado, a navegação
            do Next (sem recarregar) pode não funcionar. Um recarregamento completo
            reconstrói tudo do zero.
          */}
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
