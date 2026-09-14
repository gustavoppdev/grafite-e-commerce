import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/*
  `(store)` é um grupo de rotas: os parênteses somem da URL. `src/app/(store)/page.tsx`
  responde em `/`, não em `/store`. Serve para dar este layout (header e, depois, footer)
  só às páginas da loja. O admin e o `/design-system` ficam fora e não herdam nada disso.
*/
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/*
        Link "pular para o conteúdo": invisível até receber foco. Quem navega por teclado
        aperta Tab uma vez e pula o header inteiro em vez de passar link por link.
      */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-background focus:px-4 focus:py-2"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      {/*
        O <body> é uma coluna flex com altura mínima da tela (layout raiz) e o <main>
        cresce (`flex-1`) para ocupar a sobra: com pouco conteúdo, o footer continua no fim.
      */}
      <main id="conteudo" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
