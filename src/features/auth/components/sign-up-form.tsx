"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { type FieldErrors, toFieldErrors } from "@/lib/action-result";
import { authClient } from "../auth-client";
import { authRequest } from "../auth-request";
import { signUpFormSchema } from "../schemas";
import { AuthCard } from "./auth-card";
import { AuthField } from "./auth-field";
import { focusField } from "./focus-field";
import { PasswordField } from "./password-field";

// Renderiza a própria `AuthCard`: título e rodapé trocam na confirmação. A confirmação é
// estado, não rota: `/cadastro/sucesso` poderia ser aberta fora de contexto.
export function SignUpForm({ signInHref }: { signInHref: string }) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const parsed = signUpFormSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      const errors = toFieldErrors(parsed.error);
      setFieldErrors(errors);
      focusField(form, Object.keys(errors)[0]);
      return;
    }

    setFieldErrors({});

    // Campo a campo: passar `parsed.data` mandaria `confirmPassword` junto (o tipo não barra).
    const { name, email, password } = parsed.data;

    startTransition(async () => {
      const message = await authRequest((fetchOptions) =>
        authClient.signUp.email({ name, email, password, fetchOptions }),
      );

      if (message) {
        toast.error(message);
        return;
      }

      setDone(true);
    });
  }

  if (done) return <SignUpDone signInHref={signInHref} />;

  return (
    <AuthCard
      title="Criar conta"
      description="Cadastre-se para comprar e acompanhar seus pedidos."
      footer={
        <>
          Já tem conta?{" "}
          <Link
            href={signInHref}
            className="text-foreground underline underline-offset-4"
          >
            Entrar
          </Link>
        </>
      }
    >
      <form
        method="post"
        noValidate
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
      >
        <AuthField
          label="Nome"
          name="name"
          autoComplete="name"
          autoCapitalize="words"
          error={fieldErrors.name?.[0]}
        />
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
        {/* `new-password`: o gerenciador oferece gerar uma senha forte. */}
        <PasswordField
          label="Senha"
          name="password"
          autoComplete="new-password"
          error={fieldErrors.password?.[0]}
        />
        <PasswordField
          label="Confirme a senha"
          name="confirmPassword"
          autoComplete="new-password"
          error={fieldErrors.confirmPassword?.[0]}
        />

        <Button type="submit" disabled={pending} className="mt-1 w-full">
          {pending ? "Criando conta..." : "Criar conta"}
        </Button>

        {/* Loja de portfólio, aberta a visitantes: o risco para eles é reaproveitar senha. */}
        <p className="text-center text-meta text-muted-foreground">
          Loja de demonstração. Use uma senha que você não usa em nenhum outro
          lugar.
        </p>
      </form>
    </AuthCard>
  );
}

// A mesma tela para e-mail novo e repetido (anti-enumeração), com texto verdadeiro nos
// dois casos. Não promete e-mail enviado: nada é enviado até a verificação existir.
function SignUpDone({ signInHref }: { signInHref: string }) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  // O botão clicado sumiu: o foco vai para o título novo, senão cairia no `<body>`.
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <AuthCard
      title="Tudo pronto"
      description="Agora é só entrar com seu e-mail e senha."
      titleRef={titleRef}
    >
      <div className="flex flex-col gap-6">
        <p className="text-center text-meta text-muted-foreground">
          Se você já tinha uma conta com este e-mail, entre com a senha que já
          usava.
        </p>
        <Link
          href={signInHref}
          className={buttonVariants({ className: "w-full" })}
        >
          Entrar
        </Link>
      </div>
    </AuthCard>
  );
}
