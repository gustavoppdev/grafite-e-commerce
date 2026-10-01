"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { type FieldErrors, toFieldErrors } from "@/lib/action-result";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { authClient } from "../auth-client";
import { authErrorMessage } from "../errors";
import { type SignInInput, signInSchema } from "../schemas";
import { AuthField } from "./auth-field";

/*
  Por que um Client Component chamando o `authClient`, e não uma server action como o
  resto do projeto: o rate limit do better-auth mora no roteador HTTP de `/api/auth/*`.
  Uma action chamando `auth.api.signInEmail()` pularia o limite e deixaria a força bruta
  livre (ADR 0005).

  Tempo máximo de espera no navegador. O `fetch` não tem limite próprio: se o servidor
  travar, o botão ficaria em "Entrando..." por minutos. 15s cobre com folga o caminho
  normal (o piso de 800ms do login + as consultas, que o próprio servidor corta em 10s).
  Desistir aqui não cancela nada no servidor; se o login tiver dado certo depois, a nova
  tentativa só cria outra sessão.
*/
const REQUEST_TIMEOUT_MS = 15_000;

// Devolve a frase de erro, ou `null` quando entrou.
async function signIn(input: SignInInput): Promise<string | null> {
  try {
    const { error } = await authClient.signIn.email({
      ...input,
      fetchOptions: { timeout: REQUEST_TIMEOUT_MS },
    });
    return error ? authErrorMessage(error) : null;
  } catch {
    // Sem resposta nenhuma: rede caiu ou o tempo acabou. O `fetch` lança em vez de
    // devolver `error`, e sem este `catch` o botão ficaria preso em "Entrando...".
    return authErrorMessage({ status: 0 });
  }
}

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
      const message = await signIn(parsed.data);

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

function focusField(form: HTMLFormElement, name: string | undefined) {
  if (!name) return;
  const field = form.elements.namedItem(name);
  if (field instanceof HTMLInputElement) field.focus();
}
