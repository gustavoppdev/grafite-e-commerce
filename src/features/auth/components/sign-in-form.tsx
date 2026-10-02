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
import { PasswordField } from "./password-field";

export function SignInForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Pendente até a navegação terminar: um 2º clique não gasta outra tentativa do rate limit.
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const parsed = signInSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      const errors = toFieldErrors(parsed.error);
      setFieldErrors(errors);
      focusField(form, Object.keys(errors)[0]);
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      const message = await authRequest((fetchOptions) =>
        authClient.signIn.email({ ...parsed.data, fetchOptions }),
      );

      if (message) {
        // A frase não aponta o campo (anti-enumeração), então vai para o toast. A senha é
        // apagada e focada.
        toast.error(message);
        const password = form.elements.namedItem("password");
        if (password instanceof HTMLInputElement) password.value = "";
        focusField(form, "password");
        return;
      }

      // `replace`: voltar não cai no login. `safeRedirectPath` de novo porque `router.replace`
      // executaria `javascript:`. `refresh` para o header ler a sessão nova.
      router.replace(safeRedirectPath(redirectTo));
      router.refresh();
    });
  }

  return (
    // `post`: sem JavaScript, o padrão GET poria a senha na URL. `noValidate`: mensagens do
    // schema em vez dos balões do navegador.
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
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        error={fieldErrors.email?.[0]}
      />
      <PasswordField
        label="Senha"
        name="password"
        autoComplete="current-password"
        error={fieldErrors.password?.[0]}
      />

      {/* Só o botão trava: campo desabilitado não receberia o foco depois do erro. */}
      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
