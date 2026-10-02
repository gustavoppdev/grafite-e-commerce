import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { type Role, toRole } from "@/lib/roles";
import { auth } from "@/server/auth";

/*
  A fronteira de autorização: toda página e action com dado protegido chama
  `requireUser()`/`requireAdmin()` aqui, mesmo atrás do proxy (ADR 0003).
  `redirect()` e `notFound()` lançam: chamar dentro de `try/catch` engole a recusa.
*/

// Objeto enxuto, não o registro do banco: pode virar prop de Client Component (que vai no
// HTML), e um campo novo da tabela não vaza sem ser acrescentado aqui.
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

// `cache()`: uma leitura por requisição, mesmo com header e página chamando. Nunca
// redireciona.
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const { id, name, email, role } = session.user;
  return { id, name, email, role: toRole(role) };
});

// Sem `?next=`: o caminho de volta nasce no proxy; chegar aqui sem sessão é só para barrar.
export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/entrar");
  return user;
}

/*
  404 e não 403: 403 confirmaria que a área existe. Como o 404 esconde a recusa de nós
  também, a de alguém logado fica no log (só o id). `forbidden()` do Next exige flag
  experimental. Em `cache()`: layout, metadata e página checam (e logam) uma vez.
*/
export const requireAdmin = cache(async (): Promise<SessionUser> => {
  const user = await getSession();
  if (!user) notFound();

  if (user.role !== "admin") {
    console.warn(`[auth] requireAdmin recusou o usuário ${user.id}`);
    notFound();
  }

  return user;
});
