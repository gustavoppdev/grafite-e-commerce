import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { siteConfig } from "@/lib/site";
import "./globals.css";

/*
  `next/font` baixa a fonte no build e serve do nosso próprio domínio: o navegador
  nunca chama o Google (privacidade, e a CSP não precisa liberar domínios externos).
  Só os pesos usados: 400 na loja, 500 para cabeçalhos do admin. Menos bytes.
  `variable` expõe a fonte como `--font-sans`, que o `globals.css` liga ao `font-sans`.
*/
const fontSans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
});

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
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
