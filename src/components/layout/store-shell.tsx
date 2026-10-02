import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

// Casca da loja. Componente próprio porque o 404 da raiz fica fora do layout de (store).
export function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* "Pular para o conteúdo": visível só no foco. */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-background focus:px-4 focus:py-2"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      {/* `flex-1`: com pouco conteúdo, o footer fica no fim da tela. */}
      <main id="conteudo" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
