"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

// A versão gerada lia o tema do `next-themes`. A loja é só clara, então o tema é fixo
// e a dependência foi removida.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          /*
            O sonner injeta o próprio CSS em runtime, depois da nossa folha de estilo,
            então a sombra dele venceria a nossa classe por ordem de declaração. O `!`
            (`!shadow-none`) marca a regra como `!important` e resolve — é a exceção que
            se justifica quando o estilo vem de uma biblioteca de terceiros.
          */
          toast: "!shadow-none rounded-none",
          title: "font-normal",
          description: "text-meta text-muted-foreground",
          // Mesma cor de erro do resto da loja (borda de campo inválido, mensagens).
          error: "[&_[data-icon]]:text-destructive",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
