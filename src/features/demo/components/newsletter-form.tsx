"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { subscribeToNewsletter } from "../actions";

// Consome o `ActionResult`: `fieldErrors` colado no campo, `error` (do pedido inteiro) em toast.
export function NewsletterForm() {
  // Estado inicial `null` (ainda não houve envio). O `<form action>` funciona sem JavaScript.
  const [result, formAction, pending] = useActionState(
    subscribeToNewsletter,
    null,
  );

  // Id estável entre servidor e cliente, para o `htmlFor` do Label.
  const emailId = useId();
  const errorId = useId();

  const fieldError =
    result?.ok === false ? result.fieldErrors?.email?.[0] : undefined;

  // Um toast por resposta: cada execução da action devolve um objeto novo, então comparar a
  // identidade evita repetir o toast num re-render.
  const shown = useRef(result);

  useEffect(() => {
    if (result === null || result === shown.current) return;
    shown.current = result;

    if (result.ok) {
      toast.success(
        `Pronto! Você vai receber novidades em ${result.data.email}.`,
      );
      return;
    }

    // Só o `error` geral vira toast: o erro de campo já está visível embaixo do input,
    // e repetir a mesma frase nos dois lugares só faz barulho.
    if (!result.fieldErrors) {
      toast.error(result.error);
    }
  }, [result]);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-2">
      <Label htmlFor={emailId}>E-mail</Label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={emailId}
          name="email"
          type="email"
          placeholder="voce@exemplo.com"
          // `aria-invalid` pinta a borda (regra no `input.tsx`) e avisa o leitor de tela;
          // `aria-describedby` amarra a mensagem ao campo, para ela ser lida junto.
          aria-invalid={fieldError !== undefined}
          aria-describedby={fieldError ? errorId : undefined}
          disabled={pending}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Enviando..." : "Inscrever"}
        </Button>
      </div>

      {fieldError && (
        // `role="alert"` faz o leitor de tela anunciar a mensagem assim que ela aparece.
        <p id={errorId} role="alert" className="text-meta text-destructive">
          {fieldError}
        </p>
      )}
    </form>
  );
}
