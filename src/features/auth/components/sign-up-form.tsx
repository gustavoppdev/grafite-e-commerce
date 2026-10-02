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

/*
  O cadastro inteiro, inclusive a moldura: depois do envio, título, texto e rodapé trocam
  para a confirmação. Por isso a `AuthCard` é renderizada aqui, e não na página.

  A confirmação é um ESTADO desta tela, e não uma rota `/cadastro/sucesso`: uma rota de
  sucesso poderia ser aberta por qualquer um, fora de contexto, e "sucesso de quê?" não
  teria resposta. Recarregar a página volta ao formulário, o que é inofensivo.
*/
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

    /*
      O envio é montado campo a campo, de propósito. `parsed.data` tem `confirmPassword`,
      e passá-lo inteiro mandaria a confirmação junto na requisição: o TypeScript não
      reclama de campo a mais numa variável. A confirmação é só do formulário; o servidor
      recebe uma senha. E nenhum campo de papel (`role`) sai daqui.
    */
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
      {/* `method="post"` e `noValidate`: mesmos motivos do formulário de login. */}
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
        {/*
          `new-password` nos dois campos de senha: o gerenciador de senhas entende que é
          cadastro e oferece GERAR uma senha forte, em vez de preencher uma que já existe.
        */}
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

        {/*
          A loja é de demonstração (portfólio) e qualquer visitante pode criar conta. O
          risco real para quem testa é REAPROVEITAR a senha de outro serviço: se este banco
          vazasse, o hash protege, mas o hábito é o que o credential stuffing explora. O
          aviso fica junto do botão, que é o momento da decisão.
        */}
        <p className="text-center text-meta text-muted-foreground">
          Loja de demonstração. Use uma senha que você não usa em nenhum outro
          lugar.
        </p>
      </form>
    </AuthCard>
  );
}

/*
  A MESMA tela para "conta criada" e para "esse e-mail já tinha conta". O servidor responde
  igual nos dois casos (mesmo corpo e, com o piso de tempo, mesmo tempo), e esta tela não
  pode desfazer isso. Se ela dissesse "Conta criada!" num caso e outra coisa no outro, o
  cadastro viraria uma consulta de "quem tem conta na loja".

  Por isso o texto precisa ser VERDADEIRO nos dois casos. "Conta criada" seria falso no
  segundo. "Tudo pronto" + "entre com seu e-mail e senha" vale para os dois. A linha de
  baixo ajuda o caso mais comum do segundo (o dono do e-mail que esqueceu que já tinha
  conta) e aparece para TODO MUNDO, então não revela nada.

  Nada aqui diz "enviamos um e-mail": nada é enviado até a Feature 2. Trocar esta frase é
  o marco de que a verificação de e-mail foi ligada.
*/
function SignUpDone({ signInHref }: { signInHref: string }) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  /*
    O formulário some e a confirmação aparece no lugar. Sem mover o foco, ele ficaria num
    botão que deixou de existir (cai no `<body>`), e quem usa leitor de tela não saberia
    que algo mudou. O foco vai para o título novo, que é lido em voz alta.
  */
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
