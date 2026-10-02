import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";
import { fontSans } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  // O template aplica o sufixo em toda página que definir só o próprio título:
  // `title: "Carrinho"` vira "Carrinho | GRAFITE".
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

// `LayoutProps<"/">` é gerado pelo Next a partir das rotas (`next typegen`),
// então o tipo de `children` e dos params sempre bate com a estrutura real.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // `lang` correto faz leitores de tela pronunciarem o texto em português
    // e ajuda o navegador a hifenizar e traduzir corretamente.
    <html lang="pt-BR" className={`${fontSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        {/* Um só `<Toaster />`: dois mostrariam cada toast duas vezes. */}
        <Toaster />
      </body>
    </html>
  );
}
