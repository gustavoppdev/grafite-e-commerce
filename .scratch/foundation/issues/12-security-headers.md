# 12 - Headers de segurança

Status: open
Responsável: Claude
Blocked by: 01

## O que

- Em `next.config`, aplicar a todas as rotas os headers listados na spec: CSP base, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, e desligar `X-Powered-By`.
- CSP compatível com o Next sem nonce (e com o que o modo dev precisa), documentando o que cada diretiva libera e o que ficou para as features 2 e 10.
- Comentário por header dizendo **qual ataque** ele mitiga.

## Critérios de aceite

- [ ] Headers presentes em uma resposta de página (DevTools → Network).
- [ ] App funciona sem erros de CSP no console em `dev` e em `build && start`.
- [ ] `X-Powered-By` ausente.
