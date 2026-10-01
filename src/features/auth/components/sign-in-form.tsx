"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { type FieldErrors, toFieldErrors } from "@/lib/action-result";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { authClient } from "../auth-client";
import { authRequest } from "../auth-request";
import { signInSchema } from "../schemas";
import { AuthField } from "./auth-field";
import { focusField } from "./focus-field";

export function SignInForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  /*
    `useTransition` com função assíncrona: `pending` fica `true` do clique até a navegação
    terminar, não só até a resposta do login. O botão não volta a ficar clicável no meio
    do redirecionamento, e um segundo clique não gasta outra tentativa do rate limit.
  */
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    // Validação no navegador: feedback imediato, sem gastar requisição num formulário
    // obviamente incompleto. Quem impõe as regras de verdade é o servidor.
    const parsed = signInSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      const errors = toFieldErrors(parsed.error);
      setFieldErrors(errors);
      // Leva o foco ao primeiro campo com problema: quem usa teclado ou leitor de tela
      // cai direto onde precisa corrigir, e a mensagem do campo é lida junto.
      focusField(form, Object.keys(errors)[0]);
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      const message = await authRequest((fetchOptions) =>
        authClient.signIn.email({ ...parsed.data, fetchOptions }),
      );

      if (message) {
        /*
          Erro do pedido inteiro, não de um campo: vai para o toast. "E-mail ou senha
          incorretos" não aponta qual dos dois (é a proteção contra enumeração), então não
          faz sentido colar a frase embaixo de um deles.

          A senha é apagada e recebe o foco: é o campo que a pessoa vai redigitar.
        */
        toast.error(message);
        const password = form.elements.namedItem("password");
        if (password instanceof HTMLInputElement) password.value = "";
        focusField(form, "password");
        return;
      }

      /*
        `replace` e não `push`: voltar no navegador não deve cair de novo no login.

        O destino já veio limpo do servidor (`safeRedirectPath` na página), e passa de novo
        aqui porque `router.replace` é um ponto de execução: um `javascript:` que chegasse
        até ele RODARIA na nossa página (XSS). Conferir na boca do uso custa uma regex.

        `refresh` em seguida: o header e outras partes que leem a sessão foram renderizados
        sem ela; sem isso, a pessoa entraria e o menu continuaria dizendo "Entrar".
      */
      router.replace(safeRedirectPath(redirectTo));
      router.refresh();
    });
  }

  return (
    /*
      `method="post"`: se alguém enviar antes de o JavaScript carregar, o navegador faz o
      envio sozinho. O padrão é GET, que poria a SENHA na URL, e URL fica no histórico do
      navegador, nos logs do servidor e no `Referer` mandado a outros sites.

      `noValidate`: desliga os balões de validação do navegador (em inglês, com o visual de
      cada um) para as mensagens em pt-BR do schema aparecerem no lugar.
    */
    <form
      method="post"
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col gap-5"
    >
      <AuthField
        label="E-mail"
        name="email"
        type="email"
        // `autoComplete` certo é o que deixa o gerenciador de senhas preencher. Sem ele, a
        // pessoa digita, e quem digita escolhe senha curta e repetida.
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        error={fieldErrors.email?.[0]}
      />
      <AuthField
        label="Senha"
        name="password"
        type="password"
        autoComplete="current-password"
        error={fieldErrors.password?.[0]}
      />

      {/*
        Só o botão trava durante o envio. Os campos ficam habilitados porque, depois de um
        erro, o foco volta para a senha ainda dentro da transição, e campo desabilitado
        não recebe foco.
      */}
      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
