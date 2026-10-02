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

export default async function SignInPage({
  searchParams,
}: PageProps<"/entrar">) {
  // `?next=` vem da URL, de qualquer um: só caminho interno passa (open redirect).
  const { next } = await searchParams;
  const redirectTo = safeRedirectPath(next);

  // Já logado: o formulário não serve para nada. Fora de qualquer `try`, porque o
  // `redirect()` funciona lançando um erro que o Next intercepta.
  if (await getSession()) redirect(redirectTo);

  // O destino viaja junto para o cadastro, e do cadastro volta para cá.
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
