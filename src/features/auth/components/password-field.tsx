"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { AuthField } from "./auth-field";

// Senha com botão de mostrar: ver a senha reduz erro de digitação e incentiva senha longa.
export function PasswordField(
  props: Omit<React.ComponentProps<typeof AuthField>, "type" | "action">,
) {
  const [visible, setVisible] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Volta a esconder no envio: o gerenciador reconhece o campo pelo `type="password"`, e a
  // senha não fica exposta depois.
  useEffect(() => {
    const form = buttonRef.current?.form;
    if (!form) return;
    const hide = () => setVisible(false);
    form.addEventListener("submit", hide);
    return () => form.removeEventListener("submit", hide);
  }, []);

  return (
    <AuthField
      {...props}
      type={visible ? "text" : "password"}
      // Como texto, o corretor "consertaria" a senha e o do Chrome/Edge pode enviá-la aos
      // servidores deles: desligados sempre.
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      action={
        <button
          ref={buttonRef}
          // `type="button"`: o padrão dentro de `<form>` é submit.
          type="button"
          onClick={() => setVisible((current) => !current)}
          // Rótulo fixo + `aria-pressed` (trocar os dois se contradiria no leitor de tela).
          aria-label="Mostrar senha"
          aria-pressed={visible}
          className={buttonVariants({
            variant: "ghost",
            size: "icon-sm",
            className: "text-muted-foreground hover:text-foreground",
          })}
        >
          {visible ? (
            <EyeOffIcon strokeWidth={1.25} className="size-4" />
          ) : (
            <EyeIcon strokeWidth={1.25} className="size-4" />
          )}
        </button>
      }
    />
  );
}
