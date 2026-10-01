"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { AuthField } from "./auth-field";

/*
  Campo de senha com o botão de mostrar/ocultar. Ver a senha reduz erro de digitação,
  principalmente no celular, e é o que deixa alguém usar uma senha longa sem medo de errar.

  O mecanismo é só trocar `type="password"` por `type="text"`. Os cuidados são em volta:
*/
export function PasswordField(
  props: Omit<React.ComponentProps<typeof AuthField>, "type" | "action">,
) {
  const [visible, setVisible] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /*
    Volta a esconder quando o formulário é enviado. Gerenciadores de senha reconhecem o
    campo pelo `type="password"`: se ele estiver como texto no envio, o navegador pode não
    oferecer para salvar a senha, ou guardá-la como texto comum no histórico de
    preenchimento. E a senha não fica exposta na tela depois do envio.

    O listener é no `<form>` (que o botão conhece por `.form`), para funcionar em qualquer
    formulário sem cada um lembrar de chamar nada.
  */
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
      /*
        Com `type="text"`, o navegador passaria a tratar a senha como texto comum: o
        corretor do celular sugeriria "consertar" a senha, o teclado poria a primeira
        letra em maiúscula, e o corretor ortográfico avançado do Chrome e do Edge pode
        ENVIAR o texto do campo para os servidores deles para checar a grafia. Os três
        ficam desligados, mostrando ou não.
      */
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      action={
        <button
          ref={buttonRef}
          // `type="button"`: dentro de um `<form>`, o padrão é `submit`, e clicar no olho
          // enviaria o formulário.
          type="button"
          onClick={() => setVisible((current) => !current)}
          /*
            Rótulo fixo + `aria-pressed`: o leitor de tela anuncia "Mostrar senha, botão de
            alternância, pressionado/não pressionado". Trocar o rótulo E ter `aria-pressed`
            ao mesmo tempo diria a mesma coisa de dois jeitos contraditórios.
          */
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
