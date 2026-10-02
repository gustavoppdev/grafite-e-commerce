import { UserIcon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/server/session";
import { signOutAction } from "../actions";
import { AccountDropdown } from "./account-dropdown";

// Ler a sessão aqui torna a loja dinâmica, e é proteção: página com nome em cache de CDN
// seria servida a outra pessoa. O catálogo reabre a decisão (alternativas na spec de
// `auth-core`). Fica dentro de `<Suspense>` para o resto do header não esperar o banco.
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

  // Só nome e papel vão ao Client Component: as props dele vão no HTML.
  return <AccountDropdown name={user.name} isAdmin={user.role === "admin"} />;
}

// Mesmo ícone, mesmo tamanho (o header não pula). Sem "Entrar": seria mentira para quem
// está logado.
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

// Versão do menu lateral: o `MobileNav` (Client) recebe pronta, sem conhecer a sessão.
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
