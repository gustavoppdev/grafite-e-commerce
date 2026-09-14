"use client";

/*
  Error boundaries precisam ser Client Components: é o React, no navegador, que captura
  o erro durante a renderização e troca a página por este componente. Os botões também
  precisam de interatividade.

  Este arquivo envolve as páginas dentro de (store), mas NÃO o `(store)/layout.tsx`
  do mesmo nível. Por isso header e footer continuam na tela quando uma página quebra.
*/

import Link from "next/link";
import { useEffect } from "react";
import { PageMessage } from "@/components/layout/page-message";
import { Button, buttonVariants } from "@/components/ui/button";

export default function StoreError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Em produção, erros vindos do servidor chegam aqui com mensagem genérica (o Next
    // esconde os detalhes para não vazar informação). O erro completo fica no log do
    // servidor, identificado pelo mesmo `digest`.
    console.error(error);
  }, [error]);

  return (
    <PageMessage
      title="Algo deu errado"
      description="Não conseguimos carregar esta página. Tente novamente em instantes."
    >
      {/*
        `retry` busca os dados de novo e re-renderiza o trecho que quebrou. Serve para
        falhas temporárias (banco lento, rede instável). Há também `reset`, que só limpa
        o erro sem buscar de novo, útil em casos raros.
      */}
      <Button onClick={() => retry()}>Tentar novamente</Button>
      <Link href="/" className={buttonVariants({ variant: "link" })}>
        Voltar para a loja
      </Link>
      {/*
        O digest é um código aleatório, não revela nada do sistema. Mostrá-lo permite
        que alguém relate "erro 3f9a2c" e você encontre o registro exato nos logs.
      */}
      {error.digest && (
        <p className="text-meta text-muted-foreground">
          Código do erro: {error.digest}
        </p>
      )}
    </PageMessage>
  );
}
