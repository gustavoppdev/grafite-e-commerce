/*
  Headers de segurança aplicados a TODAS as respostas, definidos no `next.config.ts`.

  Header de segurança é defesa em profundidade: nenhum deles conserta um bug, todos
  encarecem a exploração de um bug que passou. Cada bloco abaixo diz qual ataque mitiga.

  Este arquivo não importa `server-only`: o `next.config.ts` roda fora do React, antes de
  o app existir. Aqui só há texto de configuração, nada sensível.
*/

const isDev = process.env.NODE_ENV === "development";

/*
  ────────────────────────────────────────────────────────────────────────────────
  Content-Security-Policy — contra XSS (Cross-Site Scripting)

  A CSP é a segunda barreira contra XSS: se alguém conseguir injetar `<script>` numa
  página nossa (via nome de Produto, campo de endereço, parâmetro de busca...), o
  navegador se recusa a executar o que não estiver nesta lista. A primeira barreira
  continua sendo o React, que escapa texto por padrão.

  Diretiva por diretiva:
*/
const cspDirectives = [
  // Fallback de tudo que não tem regra própria abaixo: só o nosso próprio domínio.
  "default-src 'self'",

  /*
    script-src — de onde pode vir JavaScript.

    `'unsafe-inline'` é o ponto fraco desta CSP, e é uma escolha consciente: o Next
    injeta scripts inline (o bootstrap do App Router e os chunks do RSC payload) sem
    atributo `nonce`. A alternativa é gerar um nonce por requisição no `proxy.ts`, mas
    isso força renderização DINÂMICA em todas as páginas — adeus cache estático e CDN
    numa loja cujas páginas de Produto são o caso perfeito para cache. Fica como decisão
    da Feature 10 (revisão final), como a spec registra.

    Sendo honesto sobre o que isso custa: com `'unsafe-inline'` no script-src, a CSP
    praticamente não protege contra XSS refletido. O que ela ainda garante é impedir o
    carregamento de script de OUTRO domínio — ou seja, o atacante não consegue puxar um
    payload externo, e é isso que segura o exfil de dados na maioria dos casos reais.

    `'unsafe-eval'` só em desenvolvimento: o React usa `eval` para remontar stack traces
    do servidor no navegador. Em produção nem o React nem o Next precisam disso.
  */
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,

  /*
    style-src — de onde pode vir CSS.

    `'unsafe-inline'` é necessário aqui: o sonner injeta a folha de estilo dele em runtime
    e vários componentes usam `style={{ ... }}` (atributo inline). CSS injetado é bem menos
    perigoso que script, mas não é inofensivo — dá para fazer exfiltração por seletor de
    atributo, e dá para redesenhar a tela por cima (ver `frame-ancestors` abaixo).
  */
  "style-src 'self' 'unsafe-inline'",

  // A loja não tem imagens de Produto (placeholder cinza), mas `data:` cobre SVG inline
  // e `blob:` cobre preview de upload, caso apareça.
  "img-src 'self' data: blob:",

  // As fontes vêm do `next/font`, que baixa a Hanken Grotesk no build e serve do nosso
  // domínio. Nada de fonts.gstatic.com — menos um terceiro vendo o IP dos usuários.
  "font-src 'self'",

  // connect-src — para onde o JavaScript pode abrir requisição (fetch, XHR, WebSocket).
  // É o que mais importa contra EXFILTRAÇÃO: mesmo que um script hostil rode, ele não
  // consegue mandar o que roubou para fora. Em dev, `ws:` libera o hot reload do Turbopack.
  `connect-src 'self'${isDev ? " ws:" : ""}`,

  // Contra plugins legados (Flash, Java). Não usamos nenhum, então a resposta é "nenhum".
  "object-src 'none'",

  // Contra sequestro de URL relativa: um `<base href="https://atacante.com">` injetado
  // faria todo caminho relativo da página apontar para o servidor dele.
  "base-uri 'self'",

  /*
    form-action — para onde um formulário pode enviar dados.

    Importante numa loja: impede que um `<form>` injetado mande login, endereço ou dados
    de cartão para um servidor de fora. Repare que `script-src` não cobre isso — um form
    hostil é HTML puro, sem script nenhum.
  */
  "form-action 'self'",

  /*
    frame-ancestors — contra CLICKJACKING.

    Quem pode colocar a loja dentro de um <iframe>? Ninguém. O ataque: o agressor põe a
    nossa página num iframe invisível sobre a dele e a vítima acha que está clicando em
    "ganhar prêmio" quando está clicando em "confirmar pedido" (ou "excluir conta", já
    autenticada). Substitui o `X-Frame-Options`, que mantemos junto só por navegador antigo.
  */
  "frame-ancestors 'none'",
];

/*
  Só em produção: faz o navegador trocar http:// por https:// em requisições da página.
  Fora em desenvolvimento de propósito — testar a loja pelo celular usando o IP da rede
  (http://192.168.x.x:3000) quebraria, porque um IP de LAN não é considerado origem
  confiável pelo navegador e a requisição seria promovida para https, que não existe ali.
  `localhost` sozinho não teria esse problema, mas o IP da rede tem.
*/
if (!isDev) {
  cspDirectives.push("upgrade-insecure-requests");
}

export const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspDirectives.join("; "),
  },

  /*
    Contra CLICKJACKING em navegadores que não entendem `frame-ancestors`.
    `DENY` é mais estrito que o `SAMEORIGIN` sugerido na doc do Next: a loja não
    se coloca dentro de iframe em lugar nenhum, então nem o próprio domínio precisa.
  */
  {
    key: "X-Frame-Options",
    value: "DENY",
  },

  /*
    Contra MIME sniffing. Sem ele, o navegador tenta adivinhar o tipo do arquivo pelo
    conteúdo e ignora o `Content-Type` que mandamos. Um arquivo enviado por um usuário
    como "imagem", mas contendo HTML com script, seria executado como página. Ainda não
    temos upload, mas o header custa zero e a regra vale desde já.
  */
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },

  /*
    Controla o que vai no cabeçalho `Referer` quando o usuário sai da loja por um link.
    `strict-origin-when-cross-origin`: dentro do site vai a URL completa; para fora vai
    só a origem (https://grafite.app), sem caminho nem query.

    O vazamento que isso evita é concreto: uma URL como
    /pedidos/abc123?token=... apareceria inteira no log do site de destino.
  */
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },

  /*
    Desliga APIs do navegador que a loja não usa. Reduz o estrago de um XSS: mesmo
    conseguindo rodar script, ele não consegue nem pedir acesso à câmera ou à localização
    em nome do nosso domínio. A sintaxe `()` significa "nenhuma origem pode usar".

    `payment=()` desliga a Payment Request API: o checkout da Feature 7 é simulado
    (validação de Luhn com cartões de teste) e nunca vai chamar a API de pagamento real.
  */
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()",
  },

  /*
    HSTS — contra downgrade para HTTP e roubo de cookie de sessão em rede aberta.
    Depois da primeira visita por HTTPS, o navegador passa a recusar HTTP neste domínio
    por dois anos, sem nem tentar a requisição. Navegador ignora o header em conexão não
    segura, então em `localhost` ele é inofensivo.

    Sem `preload`: entrar na lista pré-carregada dos navegadores é um compromisso quase
    irreversível (a remoção leva meses e passa por uma versão nova do navegador), e vale
    a pena só quando o domínio é definitivo. Não é o caso de um projeto de estudo.
  */
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];
