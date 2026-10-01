import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/features/auth/components/auth-card";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { getSession } from "@/server/session";

export const metadata: Metadata = {
  title: "Entrar",
};

/*
  Server Component: decide o destino e se a pessoa já está logada ANTES de mandar qualquer
  formulário para o navegador. Só o formulário é Client Component.
*/
export default async function SignInPage({
  searchParams,
}: PageProps<"/entrar">) {
  /*
    `?next=` é a página que a pessoa queria abrir antes de ser mandada para o login (o
    proxy do ticket 12 é quem o põe). Ele vem da URL, ou seja, de QUALQUER UM: um link
    `/entrar?next=https://site-falso.com` mandado por e-mail levaria a vítima, logo depois
    de digitar a senha no nosso site de verdade, para uma cópia que pede a senha "de novo"
    (open redirect usado em phishing). O `safeRedirectPath` só deixa passar caminho interno.
  */
  const { next } = await searchParams;
  const redirectTo = safeRedirectPath(next);

  // Já logado: o formulário não serve para nada. Fora de qualquer `try`, porque o
  // `redirect()` funciona lançando um erro que o Next intercepta.
  if (await getSession()) redirect(redirectTo);

  // O destino viaja junto para o cadastro, e do cadastro volta para cá (ticket 09).
  const signUpHref =
    redirectTo === safeRedirectPath(undefined)
      ? "/cadastro"
      : `/cadastro?next=${encodeURIComponent(redirectTo)}`;

  return (
    <AuthCard
      title="Entrar"
      description="Acesse sua conta para acompanhar seus pedidos."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link
            href={signUpHref}
            className="text-foreground underline underline-offset-4"
          >
            Criar conta
          </Link>
        </>
      }
    >
      <SignInForm redirectTo={redirectTo} />
    </AuthCard>
  );
}
