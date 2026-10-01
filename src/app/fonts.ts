import localFont from "next/font/local";

/*
  A fonte mora no repositório (`src/app/fonts/`), e não vem do `next/font/google`.

  Com o `next/font/google`, o BUILD baixava a fonte do Google, e de vez em quando o Google
  responde num formato que o Turbopack do Next 16.3 não consegue ler (bug aberto:
  vercel/next.js#99114). O build quebrava ao acaso, sem nenhuma mudança no código, o que
  pode derrubar um deploy. Com o arquivo aqui, o build não depende de rede nenhuma.

  O navegador continua sem chamar o Google: o `next/font` serve o arquivo do nosso próprio
  domínio (privacidade, e a CSP não precisa liberar domínio externo).

  É uma fonte VARIÁVEL: um arquivo só cobre todos os pesos de 100 a 900 (o Google entrega o
  mesmo arquivo para 400, 500 ou a faixa inteira). Usamos 400 na loja e 500 nos cabeçalhos
  do admin, e nenhum peso a mais custa byte. É o subconjunto `latin` (U+0000–00FF e alguns
  símbolos), que inclui os acentos do português.

  Licença: SIL Open Font License, em `src/app/fonts/OFL.txt`, que ela exige que acompanhe o
  arquivo. Origem: fonts.gstatic.com, Hanken Grotesk v12.

  `variable` expõe a fonte como `--font-sans`, que o `globals.css` liga ao `font-sans`.
  Fica num arquivo próprio porque dois documentos usam: o layout raiz e o global-error.
*/
export const fontSans = localFont({
  src: "./fonts/hanken-grotesk-latin.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-sans",
});
