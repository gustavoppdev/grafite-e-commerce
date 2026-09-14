import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/*
  O "casco" da loja: link de pular, header, conteúdo e footer.
  Existe como componente (e não só dentro do layout) porque o 404 da raiz também
  precisa dele: URLs inexistentes são renderizadas FORA do layout de (store).
*/
export function StoreShell({ children }: { children: React.ReactNode }) {
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
