import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { getSession } from "@/server/session";

export const metadata: Metadata = {
  title: "Criar conta",
};

export default async function SignUpPage({
  searchParams,
}: PageProps<"/cadastro">) {
  // `?next=` vem da URL, de qualquer um: só caminho interno passa (open redirect).
  const { next } = await searchParams;
  const redirectTo = safeRedirectPath(next);

  if (await getSession()) redirect(redirectTo);

  // Cadastro não faz login: o destino segue até o `/entrar`, que redireciona.
  const signInHref =
    redirectTo === safeRedirectPath(undefined)
      ? "/entrar"
      : `/entrar?next=${encodeURIComponent(redirectTo)}`;

  return <SignUpForm signInHref={signInHref} />;
}
