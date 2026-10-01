import { UserIcon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import { getSession } from "@/server/session";
import { AccountDropdown } from "./account-dropdown";

/*
  Menu da conta no header: "Entrar" para Visitante, menu com o nome para quem está logado.

  LER A SESSÃO AQUI TORNA AS PÁGINAS DA LOJA DINÂMICAS (renderizadas a cada requisição, não
  no build). É de propósito, e é proteção: uma página com o nome de uma pessoa guardada no
  cache da CDN seria servida para a próxima visitante, com o nome da anterior. A Feature 5
  (Catálogo) reabre essa decisão, porque página de Produto é o caso perfeito de cache; as
  alternativas estão na spec de `auth-core` ("Rotas e telas").

  O header coloca este componente dentro de `<Suspense>`: o logo, as categorias e o
  carrinho saem na hora, e só este pedaço espera o banco.
*/
export async function AccountMenu() {
  const user = await getSession();

  if (!user) {
    return (
      <Link
        href="/entrar"
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <UserIcon strokeWidth={1.25} className="size-5" />
        <span className="sr-only">Entrar</span>
      </Link>
    );
  }

  /*
    Só nome e "é Admin?" atravessam para o Client Component. Prop de Client Component vai
    serializada no HTML da página, legível por quem abrir o código-fonte. Nada de e-mail,
    id ou campos de ban: o menu não precisa deles.
  */
  return <AccountDropdown name={user.name} isAdmin={user.role === "admin"} />;
}

/*
  O que aparece enquanto a sessão não chegou: o MESMO ícone, no MESMO tamanho, sem ser
  clicável. Se o fallback tivesse outro tamanho, o header pularia quando a sessão chegasse.
  Não mostra "Entrar" porque, para quem está logado, isso seria mentira por um instante.
*/
export function AccountMenuFallback() {
  return (
    <span
      aria-hidden="true"
      className={buttonVariants({
        variant: "ghost",
        size: "icon",
        className: "pointer-events-none text-subtle-foreground",
      })}
    >
      <UserIcon strokeWidth={1.25} className="size-5" />
    </span>
  );
}

/*
  As mesmas opções, para o menu lateral do celular. Também é Server Component: o
  `MobileNav` (Client) recebe este bloco já renderizado, pela prop `account`, e não precisa
  saber nada da sessão. Fica dentro de `<Suspense>` do mesmo jeito.
*/
export async function MobileAccountLinks() {
  const user = await getSession();
  const linkClass = "block px-4 py-3 hover:bg-muted";

  if (!user) {
    return (
      <ul className="flex flex-col">
        <li>
          <Link href="/entrar" className={linkClass}>
            Entrar
          </Link>
        </li>
        <li>
          <Link href="/cadastro" className={linkClass}>
            Criar conta
          </Link>
        </li>
      </ul>
    );
  }

  return (
    <div className="flex flex-col">
      <p className="truncate px-4 pt-3 pb-1 text-meta text-muted-foreground">
        {user.name}
      </p>
      <ul className="flex flex-col">
        <li>
          <Link href="/conta" className={linkClass}>
            Minha conta
          </Link>
        </li>
        {user.role === "admin" && (
          <li>
            <Link href="/admin" className={linkClass}>
              Administração
            </Link>
          </li>
        )}
        <li>
          <form action={signOutAction}>
            <button type="submit" className={`${linkClass} w-full text-left`}>
              Sair
            </button>
          </form>
        </li>
      </ul>
    </div>
  );
}
