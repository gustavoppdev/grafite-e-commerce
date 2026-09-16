# 12 - Headers de segurança

Status: resolved
Responsável: Claude
Blocked by: 01

## O que

- Em `next.config`, aplicar a todas as rotas os headers listados na spec: CSP base, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, e desligar `X-Powered-By`.
- CSP compatível com o Next sem nonce (e com o que o modo dev precisa), documentando o que cada diretiva libera e o que ficou para as features 2 e 10.
- Comentário por header dizendo **qual ataque** ele mitiga.

## Critérios de aceite

- [x] Headers presentes em uma resposta de página (DevTools → Network).
- [x] App funciona sem erros de CSP no console em `dev` e em `build && start`.
- [x] `X-Powered-By` ausente.

## Comments

Headers em `src/lib/security-headers.ts`, aplicados em `/(.*)` pelo `next.config.ts`.
Modulo separado porque o `next.config` deve continuar legivel e os comentarios de "qual
ataque cada header mitiga" sao longos por natureza.

**CSP sem nonce**, como a spec previu. `script-src` leva `'unsafe-inline'` porque o Next
injeta scripts inline sem `nonce`; a alternativa (nonce por requisicao no `proxy.ts`) forca
renderizacao dinamica em todas as paginas e mata o cache estatico - decisao adiada para a
Feature 11. Registrado no comentario que, com `'unsafe-inline'`, a CSP quase nao protege
contra XSS refletido; o que ela ainda garante e bloquear script de outro dominio, e e isso
que segura a exfiltracao.

**Diferencas dev/prod:** `'unsafe-eval'` (React remonta stack traces do servidor) e `ws:`
(hot reload do Turbopack) so em desenvolvimento. `upgrade-insecure-requests` so em producao
- em dev ele quebraria testar a loja pelo celular via IP da rede (`http://192.168.x.x:3000`),
porque IP de LAN nao e origem confiavel e a requisicao seria promovida para https.

**Adicionado alem da spec:** `Strict-Transport-Security` (sem `preload`, que e compromisso
quase irreversivel e nao se justifica num projeto de estudo) e `payment=()` no
`Permissions-Policy` - o checkout da Feature 8 e simulado e nunca chama a Payment Request API.

**Verificado.** Dev e `build && start`: todos os headers presentes em `/` e em `/api/health`,
`X-Powered-By` ausente, zero violacao de CSP no console, fonte do `next/font` carregada
(`Hanken Grotesk: loaded`), toast e server action funcionando.

A CSP foi testada ativamente no navegador, nao so lida no header:

| tentativa | diretiva | resultado |
|---|---|---|
| `fetch("https://example.com/...")` | `connect-src 'self'` | bloqueado |
| `<script src="https://cdn.jsdelivr.net/...">` | `script-src 'self'` | bloqueado |
| `<base href="https://atacante.test/">` | `base-uri 'self'` | bloqueado |

**Para a Feature 2:** o Turnstile vai precisar de `script-src`, `frame-src` e `connect-src`
para `https://challenges.cloudflare.com`.
