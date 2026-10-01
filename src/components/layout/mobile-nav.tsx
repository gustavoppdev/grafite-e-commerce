"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "./logo";
import type { NavLink } from "./navigation";

/*
  Este é o único pedaço do header que precisa de JavaScript no navegador:
  abrir/fechar o menu é estado (`useState`) e reage a cliques.
  Os links chegam por props, vindos do Server Component. Por isso eles precisam
  ser dados serializáveis (strings, números, objetos simples), nunca funções.
*/
export function MobileNav({
  links,
  account,
}: {
  links: NavLink[];
  // A parte da conta, renderizada no servidor (lê a sessão) e entregue pronta.
  account?: React.ReactNode;
}) {
  // Estado controlado para fechar o menu ao clicar num link: como a navegação
  // do Next não recarrega a página, o Sheet continuaria aberto sozinho.
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* No Base UI, `render` troca o elemento renderizado (no Radix era `asChild`). */}
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="-ml-2" />}
      >
        <MenuIcon strokeWidth={1.25} className="size-5" />
        <span className="sr-only">Abrir menu</span>
      </SheetTrigger>

      <SheetContent side="left" className="shadow-none">
        <SheetHeader>
          {/* Todo diálogo precisa de um título para leitores de tela anunciarem o que abriu. */}
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>

        {/*
          Fecha o menu quando QUALQUER link dentro dele é clicado, inclusive os da conta, que
          chegam prontos do servidor e não têm como receber um `onClick` daqui.
        */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: só observa cliques que acontecem nos links de dentro; não é um controle. */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: Enter num link também dispara `click`. */}
        <div
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <nav aria-label="Categorias">
            <ul className="flex flex-col">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block px-4 py-3 hover:bg-muted"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {account && (
            <nav aria-label="Conta" className="mt-4 border-t pt-2">
              {account}
            </nav>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
