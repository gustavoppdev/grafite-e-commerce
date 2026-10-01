import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { requireAdmin } from "@/server/session";

/*
  Casca mínima da administração, fora do grupo `(store)`: sem o header da loja, sem
  carrinho. A Feature 3 constrói a navegação de verdade.

  A PROTEÇÃO NÃO É ESTE LAYOUT. Layout não é renderizado de novo a cada navegação e não
  impede as páginas de baixo de rodarem, então cada página de `/admin` chama
  `requireAdmin()` por conta própria (doc do Next: "Layouts and auth checks").

  Então por que ele também chama? Para NÃO VAZAR a casca. Layout e página rodam em
  paralelo, e o que o layout renderiza vai no payload RSC embutido no HTML, mesmo quando a
  página recusa com `notFound()`. Medido no ticket 11: sem esta linha, a 404 que um
  Visitante recebe em `/admin` trazia "Administração" escondido no payload, e a 404 de uma
  URL inexistente não trazia. Bastava comparar as duas para saber que a área existe. Com a
  checagem aqui, a casca só é renderizada para Admin.

  O `requireAdmin()` está em `cache()`: layout + página fazem uma checagem só.
*/
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
