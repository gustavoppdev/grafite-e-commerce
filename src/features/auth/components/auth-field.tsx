"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/*
  Rótulo + campo + erro, ligados entre si. Os formulários de entrar e cadastrar repetiriam
  esse trio a cada campo, e é justamente a ligação que costuma ser esquecida:

  - `htmlFor`/`id`: clicar no rótulo foca o campo, e o leitor de tela sabe qual rótulo é
    de qual campo. O `useId` gera um id estável entre servidor e cliente.
  - `aria-invalid`: pinta a borda (regra no `input.tsx`) e avisa o leitor de tela.
  - `aria-describedby`: amarra a mensagem ao campo, que é lida junto quando ele recebe foco.

  A mensagem é texto puro do React, nunca HTML: mesmo que um dia ela viesse de fora, o
  React a escaparia em vez de executá-la.
*/
export function AuthField({
  label,
  error,
  ...inputProps
}: {
  label: string;
  error?: string;
} & Omit<React.ComponentProps<"input">, "id">) {
  const inputId = useId();
  const errorId = useId();

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        aria-invalid={error !== undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error && (
        // `role="alert"`: o leitor de tela anuncia a mensagem assim que ela aparece.
        <p id={errorId} role="alert" className="text-meta text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
