"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { subscribeToNewsletter } from "../actions";

/*
  Consumo do `ActionResult`: o formulário é o único Client Component desta demo.
  A página que o usa continua Server Component.

  Duas formas de mostrar a falha, e elas não competem:
  - `fieldErrors` aparece COLADO no campo, porque é lá que o usuário vai corrigir;
  - `error` vira toast, porque é sobre o pedido inteiro e não pertence a campo nenhum.
*/
export function NewsletterForm() {
  /*
    `useActionState` guarda o retorno da action no estado, entrega um `action` para o
    `<form>` e um `pending` enquanto a requisição está no ar. O estado inicial é `null`
    (ainda não houve envio) — daí o `| null` na assinatura da action.

    O `<form action={...}>` também é o que faz isso funcionar sem JavaScript: se o bundle
    ainda não carregou, o navegador envia o formulário do jeito antigo e a action roda igual.
  */
  const [result, formAction, pending] = useActionState(
    subscribeToNewsletter,
    null,
  );

  // `useId` gera um id único e estável entre servidor e cliente. Necessário para o
  // `htmlFor` do Label: sem ele, clicar no rótulo não foca o campo e o leitor de tela
  // não sabe qual rótulo pertence a qual input.
  const emailId = useId();
  const errorId = useId();

  const fieldError =
    result?.ok === false ? result.fieldErrors?.email?.[0] : undefined;

  /*
    O toast é um efeito colateral: dispara uma vez por resposta, não a cada render.
    Comparar a identidade do objeto resolve — cada execução da action devolve um objeto
    novo, então `result !== shown.current` só é verdade quando chegou resposta nova.
    (Um `useEffect` com `[result]` sozinho re-dispararia se o componente renderizasse
    de novo por outro motivo, e o usuário veria o mesmo toast duas vezes.)
  */
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
