"use client";

import { UserIcon } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/features/auth/actions";

/*
  O menu aberto pelo ícone de conta. É Client Component porque abrir e fechar é estado no
  navegador; quem decide se há sessão é o `AccountMenu`, no servidor, que passa só o nome
  e se a pessoa é Admin.
*/
export function AccountDropdown({
  name,
  isAdmin,
}: {
  name: string;
  isAdmin: boolean;
}) {
  const signOutFormId = useId();

  return (
    <>
      {/*
        O formulário de sair fica FORA do menu, e o item "Sair" o envia pelo atributo
        `form`. O menu é desmontado ao fechar; se o `<form>` morasse dentro dele, poderia
        sumir junto no meio do envio.
      */}
      <form id={signOutFormId} action={signOutAction} hidden />

      <DropdownMenu>
        <DropdownMenuTrigger
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <UserIcon strokeWidth={1.25} className="size-5" />
          <span className="sr-only">Minha conta</span>
        </DropdownMenuTrigger>

        {/*
          A largura padrão do componente é a do botão que abre (`--anchor-width`): 40px, aqui.
          O menu ganha largura própria, alinhado pela direita do ícone, e segue o visual reto
          e sem sombra da loja.
        */}
        <DropdownMenuContent
          align="end"
          className="w-56 rounded-none shadow-none ring-border"
        >
          <DropdownMenuGroup>
            {/* O nome vem do banco, digitado pela pessoa: o React o escapa como texto. */}
            <DropdownMenuLabel className="truncate px-2 py-2 text-sm text-foreground">
              {name}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={<Link href="/conta" />}
            className="rounded-none px-2 py-2"
          >
            Minha conta
          </DropdownMenuItem>
          {/*
            Conveniência de interface, não segurança: esconder o link não protege nada. Quem
            barra o acesso a `/admin` é o `requireAdmin()`, na própria página.
          */}
          {isAdmin && (
            <DropdownMenuItem
              render={<Link href="/admin" />}
              className="rounded-none px-2 py-2"
            >
              Administração
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={<button type="submit" form={signOutFormId} />}
            nativeButton
            className="w-full rounded-none px-2 py-2"
          >
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
