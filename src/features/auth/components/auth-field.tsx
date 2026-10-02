"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Rótulo + campo + erro ligados: `htmlFor`/`id`, `aria-invalid` e `aria-describedby` (a
// mensagem é lida quando o campo recebe foco).
export function AuthField({
  label,
  error,
  action,
  ...inputProps
}: {
  label: string;
  error?: string;
  // Um botão dentro do campo, encostado à direita (o "mostrar senha").
  action?: React.ReactNode;
} & Omit<React.ComponentProps<"input">, "id">) {
  const inputId = useId();
  const errorId = useId();

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <Input
          id={inputId}
          aria-invalid={error !== undefined}
          aria-describedby={error ? errorId : undefined}
          // Espaço à direita para o texto digitado não passar por baixo do botão.
          className={action ? "pr-11" : undefined}
          {...inputProps}
        />
        {action && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">
            {action}
          </div>
        )}
      </div>
      {error && (
        // `role="alert"`: o leitor de tela anuncia a mensagem assim que ela aparece.
        <p id={errorId} role="alert" className="text-meta text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
