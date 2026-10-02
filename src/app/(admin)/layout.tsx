import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { requireAdmin } from "@/server/session";

// Não é a proteção (layout não roda a cada navegação; cada página chama `requireAdmin()`).
// Chama também para a casca não ir no payload RSC da 404 de quem não é Admin. `cache()` faz
// layout + página checarem uma vez.
export default async function AdminLayout({ children }: LayoutProps<"/">) {
  await requireAdmin();

  return (
    <>
      <header className="border-b">
        <Container className="flex h-15 items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-meta text-muted-foreground">
              Administração
            </span>
          </div>
          <Link href="/" className="underline-offset-4 hover:underline">
            Voltar para a loja
          </Link>
        </Container>
      </header>
      <main id="conteudo" className="flex flex-1 flex-col">
        {children}
      </main>
    </>
  );
}
