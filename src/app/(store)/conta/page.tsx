import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import { requireUser } from "@/server/session";

export const metadata: Metadata = {
  title: "Minha conta",
  // Área pessoal: não há nada aqui que um buscador deva indexar.
  robots: { index: false },
};

// Checagem na página, não no layout: o layout não roda a cada navegação e não impede a
// página de renderizar. E mesmo atrás do proxy (ADR 0003).
export default async function AccountPage() {
  // Sem sessão: redireciona para `/entrar`. Fora de `try`, porque o redirect lança.
  const user = await requireUser();

  return (
    <Container className="flex max-w-xl flex-col gap-10 py-16 sm:py-24">
      <div className="flex flex-col gap-2">
        <h1>Minha conta</h1>
        <p className="text-muted-foreground">
          Endereços e pedidos chegam aqui nas próximas etapas da loja.
        </p>
      </div>

      {/* Só os dados da PRÓPRIA pessoa, vindos da sessão, nunca de um id na URL. */}
      <dl className="flex flex-col divide-y border-y">
        <div className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-6">
          <dt className="text-muted-foreground sm:w-24">Nome</dt>
          <dd className="break-words">{user.name}</dd>
        </div>
        <div className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-6">
          <dt className="text-muted-foreground sm:w-24">E-mail</dt>
          <dd className="break-all">{user.email}</dd>
        </div>
      </dl>

      <form action={signOutAction}>
        <Button type="submit" variant="outline">
          Sair
        </Button>
      </form>
    </Container>
  );
}
