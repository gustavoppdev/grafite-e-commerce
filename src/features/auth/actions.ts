"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

// Sair é a única operação de auth por action: não precisa de rate limit, funciona sem
// JavaScript, e o `redirect()` já devolve a página sem a sessão. O Next confere o `Origin`.
export async function signOutAction() {
  // Sem sessão, não lança. O `nextCookies()` é quem faz o "apague o cookie" chegar à resposta.
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
