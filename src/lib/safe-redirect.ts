/*
  Protege contra OPEN REDIRECT. O link de ataque é do nosso domínio de verdade:

    https://grafite.vercel.app/entrar?next=https://grafite-1ogin.com/conta

  A vítima confere o domínio, entra com a senha certa no site certo, e o nosso redirect
  pós-login a manda para uma cópia do site que pede a senha "de novo". O `?next=` é
  entrada de usuário, igual ao corpo de um formulário.

  A estratégia é LISTA DE PERMISSÃO: a função não pergunta "isso é perigoso?" (sempre
  falta um caso na lista de proibições), pergunta "isso tem a forma de um caminho
  interno?". A forma é estreita de propósito, e tudo que não cabe nela cai no `fallback`.

  `value` é `unknown` porque esta função é uma fronteira de confiança: o `searchParams`
  entrega `string | string[] | undefined`, e quem chama não deveria precisar filtrar
  nada antes. Qualquer coisa entra, e a verificação é toda feita aqui dentro.
*/

/*
  A forma de um caminho interno, lida da esquerda para a direita:

  - `^\/`        começa com UMA barra. Derruba tudo que é absoluto ou relativo:
                 `https://…`, `https:/…`, `javascript:…`, `data:…`, `\\…` e `next`.
  - `(?![/\\])`  o 2º caractere NÃO é `/` nem `\`. Derruba `//exemplo.invalido` e
                 `/\exemplo.invalido`: o navegador lê os dois como "outro domínio", e os
                 dois começam com `/` (é por isso que `startsWith("/")` não basta).
  - `[…]*$`      daí em diante, SÓ os caracteres que um caminho da loja usa: letras e
                 números ASCII, `-._~`, `/`, `?`, `#`, `=`, `&`, `%`, `+`, `,`.

  Repare no que ficou de FORA da lista de caracteres, e por quê:
  - `@`: numa URL, o que vem antes do `@` é usuário, não host (`https://grafite.app@exemplo
    .invalido` vai para exemplo.invalido). Nenhuma rota nossa tem `@`.
  - `\`: vários navegadores tratam como `/`.
  - `:`: é o que faz `javascript:` e `https:` virarem esquema.
  - espaço, tab e quebra de linha: o navegador APAGA tab e quebra de linha de URLs, então
    `/<tab>/exemplo.invalido` vira `//exemplo.invalido` depois da nossa checagem.
  - qualquer caractere não-ASCII. Slugs e rotas são ASCII; um caminho que tenha outra
    coisa cai no `fallback`, que é um erro seguro (a pessoa vai para /conta).
*/
const INTERNAL_PATH = /^\/(?![/\\])[A-Za-z0-9\-._~/?#=&%+,]*$/;

/*
  Barra, contrabarra e o próprio `%` CODIFICADOS são recusados.

  O `searchParams` do Next já decodificou o valor UMA vez: `?next=%2Fconta` chega aqui como
  `/conta`. Então um `%2f` que sobrou aqui veio codificado DUAS vezes no link, e ninguém faz
  isso sem querer. Se alguma camada no caminho (proxy, CDN, o próprio navegador) decodificar
  de novo, `/%2f%2fexemplo.invalido` vira `///exemplo.invalido` — outro domínio. O `%25` (o
  próprio `%` codificado) entra na lista porque é o degrau para codificar três vezes.

  Por que recusar em vez de decodificar e checar: a regra é VALIDAR A MESMA STRING QUE SERÁ
  USADA. Decodificar para checar e devolver a original é "checou X, usou Y", a origem da
  maioria dos bypasses. Decodificar e devolver a decodificada muda o caminho da pessoa. E o
  `decodeURIComponent` ainda LANÇA erro com entrada malformada (`%E0%A4%A`). Nenhum caminho
  legítimo da loja precisa de barra codificada, então recusar é mais simples e mais seguro.
*/
const ENCODED_SEPARATOR = /%(2f|5c|25)/i;

// Domínio que não existe (`.invalid` é reservado pela RFC 2606), usado só como base para
// o `new URL` abaixo. Nunca sai daqui.
const PROBE_ORIGIN = "https://safe-redirect.invalid";

export function safeRedirectPath(value: unknown, fallback = "/conta"): string {
  // `string[]` (`?next=a&next=b`), `undefined` e `null` param aqui. A string vazia para
  // na regex, que exige a barra inicial.
  if (typeof value !== "string") return fallback;

  if (!INTERNAL_PATH.test(value)) return fallback;
  if (ENCODED_SEPARATOR.test(value)) return fallback;

  /*
    Segunda opinião, com o parser de URL de verdade: resolvido contra uma origem qualquer,
    um caminho interno TEM que continuar nela. As duas regras acima já garantem isso; esta
    linha existe para o dia em que alguém afrouxar a regex e esquecer um caso. Sozinha ela
    não bastaria: `next` e `/conta@exemplo.invalido` continuam na mesma origem e passariam.
  */
  if (new URL(value, PROBE_ORIGIN).origin !== PROBE_ORIGIN) return fallback;

  /*
    Caminho interno que a pessoa talvez não possa ver (`/admin` para um Cliente) PASSA.
    Esta função responde "fica no nosso site?", não "a pessoa pode abrir isto?". Quem
    responde a segunda é a própria página (`requireAdmin` devolve 404). Barrar aqui exigiria
    uma lista de rotas, que ficaria desatualizada a cada rota nova, e não fecharia nada que
    a autorização já não feche (ADR 0003).
  */
  return value;
}
