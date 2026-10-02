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
import { signOutAction } from "../actions";

// Client Component só pelo abrir/fechar; a sessão é decidida no servidor.
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
      {/* O form de sair fica fora do popup (enviado por `form=`): o popup é desmontado ao fechar. */}
      <form id={signOutFormId} action={signOutAction} hidden />

      <DropdownMenu>
        <DropdownMenuTrigger
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <UserIcon strokeWidth={1.25} className="size-5" />
          <span className="sr-only">Minha conta</span>
        </DropdownMenuTrigger>

        {/* Largura própria: a padrão seria a do ícone que abre (40px). */}
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
          {/* Esconder o link não protege: quem barra é o `requireAdmin()` da página. */}
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
