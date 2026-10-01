import { SearchIcon, ShoppingBagIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  AccountMenu,
  AccountMenuFallback,
  MobileAccountLinks,
} from "@/features/auth/components/account-menu";
import { Container } from "./container";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { categoryLinks } from "./navigation";

/*
  Server Component (sem "use client"): o HTML do header chega pronto do servidor
  e não manda JavaScript para o navegador. Só o <MobileNav>, que tem estado,
  é client. Regra prática: empurre o "use client" para as folhas da árvore.
*/
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background">
      {/* Três colunas: as laterais dividem o espaço igualmente, então o logo fica no centro exato. */}
      <Container className="grid h-15 grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex items-center">
          <div className="md:hidden">
            <MobileNav
              links={categoryLinks}
              account={
                <Suspense fallback={null}>
                  <MobileAccountLinks />
                </Suspense>
              }
            />
          </div>

          <nav aria-label="Categorias" className="hidden md:block">
            <ul className="flex items-center gap-6">
              {categoryLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Link href="/" aria-label="Página inicial">
          <Logo />
        </Link>

        <div className="-mr-2 flex items-center justify-end">
          {/* Ícone sozinho não tem texto: o `sr-only` dá nome ao link para leitores de tela. */}
          <Link
            href="/produtos"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <SearchIcon strokeWidth={1.25} className="size-5" />
            <span className="sr-only">Buscar</span>
          </Link>
          {/*
            Só no desktop: no celular, as opções de conta ficam no menu lateral. O
            `<Suspense>` deixa o resto do header sair sem esperar a sessão; o fallback tem o
            mesmo tamanho do ícone, para nada pular quando ela chega.
          */}
          <div className="hidden md:flex">
            <Suspense fallback={<AccountMenuFallback />}>
              <AccountMenu />
            </Suspense>
          </div>
          <Link
            href="/carrinho"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <ShoppingBagIcon strokeWidth={1.25} className="size-5" />
            <span className="sr-only">Carrinho</span>
          </Link>
        </div>
      </Container>
    </header>
  );
}
