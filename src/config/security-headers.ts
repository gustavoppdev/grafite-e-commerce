// Headers de segurança de todas as respostas (via `next.config.ts`, por isso sem
// `server-only`). Defesa em profundidade: encarecem a exploração de um bug que passou.

const isDev = process.env.NODE_ENV === "development";

// CSP: segunda barreira contra XSS (a primeira é o escape do React).
const cspDirectives = [
  "default-src 'self'",

  // `'unsafe-inline'` é o ponto fraco consciente: o Next injeta scripts inline sem nonce, e
  // nonce por requisição deixaria todas as páginas dinâmicas. Ainda bloqueia script de outro
  // domínio. `'unsafe-eval'` só em dev (stack traces do React).
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,

  // `'unsafe-inline'`: o sonner injeta estilo em runtime e há `style={{}}` em componentes.
  "style-src 'self' 'unsafe-inline'",

  // `data:` para SVG inline, `blob:` para preview de upload.
  "img-src 'self' data: blob:",

  // Fonte servida do próprio domínio (`next/font`): nenhum terceiro vê o IP de quem visita.
  "font-src 'self'",

  // Contra exfiltração: script hostil não manda dados para fora. `ws:` em dev (hot reload).
  `connect-src 'self'${isDev ? " ws:" : ""}`,

  "object-src 'none'",

  // Contra `<base href>` injetado redirecionando os caminhos relativos.
  "base-uri 'self'",

  // Um `<form>` injetado não envia dados para fora (é HTML puro, o `script-src` não cobre).
  "form-action 'self'",

  // Contra clickjacking: ninguém põe a loja num iframe.
  "frame-ancestors 'none'",
];

// Só em produção: em dev quebraria o acesso pelo IP da rede (http://192.168.x.x).
if (!isDev) {
  cspDirectives.push("upgrade-insecure-requests");
}

export const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspDirectives.join("; "),
  },

  // Clickjacking em navegador sem `frame-ancestors`. `DENY`: nem o próprio domínio usa iframe.
  {
    key: "X-Frame-Options",
    value: "DENY",
  },

  // Contra MIME sniffing: um upload "imagem" com HTML não é executado como página.
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },

  // Para fora vai só a origem: URL com token não aparece no log de outro site.
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },

  // Desliga APIs que a loja não usa: um XSS não pede câmera nem localização. O checkout é
  // simulado, então nem a Payment Request API.
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()",
  },

  // HSTS: depois da 1ª visita, o navegador recusa HTTP por 2 anos. Sem `preload`, que é quase
  // irreversível e só vale para domínio definitivo.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];
