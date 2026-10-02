import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { type Role, toRole } from "@/lib/roles";
import { auth } from "@/server/auth";

/*
  A fronteira de autorização do projeto. Toda página, server action e query que mexe com
  dado protegido chama `requireUser()` ou `requireAdmin()` AQUI, mesmo que o `proxy.ts`
  (ticket 12) já tenha filtrado a rota antes.

  Por que repetir a checagem em vez de confiar no proxy (ADR 0003):
  - O proxy já foi contornado: a CVE-2025-29927 deixava pular o middleware do Next com um
    único header na requisição. Quem dependia só dele ficou com a área logada aberta.
  - Ele não roda em todo caminho de código. Uma server action pode ser chamada direto, por
    POST, sem passar pela página que a contém.
  A checagem que vale é a que fica colada no dado.

  ATENÇÃO: `redirect()` e `notFound()` funcionam LANÇANDO um erro especial que o Next
  intercepta. Chamar `requireUser()` dentro de um `try/catch` engole esse erro, e a página
  segue renderizando para quem não deveria vê-la. Chame fora do `try`.
*/

/*
  O que sai daqui é um objeto ENXUTO, não o registro do banco. O resultado vai para Server
  Components, que podem passá-lo como prop a um Client Component — e prop de Client
  Component é serializada no HTML, visível para quem abrir o código-fonte da página.
  Copiando só os campos necessários, um campo novo na tabela `user` (ou os de ban, ou um
  hash) nunca vaza por acidente: para aparecer, alguém precisa acrescentá-lo aqui.
*/
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  // Lido por `toRole` (`src/lib/roles.ts`): `null` ou valor estranho vira "user".
  role: Role;
};

/*
  `cache()` do React: dentro de UMA requisição, a primeira chamada vai ao banco e as
  seguintes reaproveitam o resultado. O header (menu da conta, ticket 10) e a página
  chamam a sessão cada um por conta própria; sem `cache()` seriam duas consultas iguais
  por página. Entre requisições diferentes nada é compartilhado, então não existe risco de
  uma pessoa receber a sessão de outra.

  Para quem só quer SABER se há alguém logado (ex.: o menu da conta). Nunca redireciona.
*/
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const { id, name, email, role } = session.user;
  return { id, name, email, role: toRole(role) };
});

/*
  Para páginas e actions que exigem login. Sem sessão, manda para `/entrar` SEM `?next=`:
  o caminho de volta é conveniência e nasce no proxy (ticket 12), que sabe qual página a
  pessoa queria. Chegar aqui sem sessão significa que o proxy falhou ou não cobre o caminho,
  e aí o trabalho desta função é só barrar.
*/
export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/entrar");
  return user;
}

/*
  Para a área de administração. Recusa com 404, não 403:
  - 403 confirma que a rota existe e que ali há uma área protegida — é um mapa para quem
    está sondando o site. 404 não confirma nada: para quem não é Admin, `/admin` não existe.

  O 404 esconde a recusa de NÓS também. Um Admin que perdeu o papel (bug, ban, o script do
  ticket 14 rodado errado) vê "página não encontrada" e reporta que o site quebrou. Por isso,
  quando a recusa é de alguém LOGADO, fica uma linha no log do servidor com o id: a resposta
  na rede continua opaca, e a informação fica do nosso lado. Visitante não gera log — não há
  id para registrar, e um log por robô varrendo `/admin` seria só ruído.

  Não usamos `forbidden()`/`unauthorized()` do Next: exigem `experimental.authInterrupts`,
  e flag experimental na base da autorização é risco sem retorno.
*/
/*
  Também em `cache()`: o layout, o `generateMetadata` e a página de `/admin` chamam esta
  função na mesma requisição. O `cache()` guarda até o erro lançado pelo `notFound()`, então
  as chamadas seguintes recusam igual, sem repetir a checagem e sem repetir a linha de log.
*/
export const requireAdmin = cache(async (): Promise<SessionUser> => {
  const user = await getSession();
  if (!user) notFound();

  if (user.role !== "admin") {
    // Só o id: e-mail e nome são dado pessoal e não precisam morar no log.
    console.warn(`[auth] requireAdmin recusou o usuário ${user.id}`);
    notFound();
  }

  return user;
});
