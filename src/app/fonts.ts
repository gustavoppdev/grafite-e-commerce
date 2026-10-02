import localFont from "next/font/local";

// Fonte local, não `next/font/google`: o download no build quebrava o Turbopack ao acaso
// (vercel/next.js#99114). Servida do próprio domínio. Variável (todos os pesos num arquivo),
// subconjunto latin. Licença OFL em `src/app/fonts/OFL.txt`.
export const fontSans = localFont({
  src: "./fonts/hanken-grotesk-latin.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-sans",
});
