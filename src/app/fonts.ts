import { Hanken_Grotesk } from "next/font/google";

/*
  `next/font` baixa a fonte no build e serve do nosso próprio domínio: o navegador
  nunca chama o Google (privacidade, e a CSP não precisa liberar domínios externos).
  Só os pesos usados: 400 na loja, 500 para cabeçalhos do admin. Menos bytes.
  `variable` expõe a fonte como `--font-sans`, que o `globals.css` liga ao `font-sans`.

  Fica num arquivo próprio porque dois documentos usam: o layout raiz e o global-error.
*/
export const fontSans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
});
