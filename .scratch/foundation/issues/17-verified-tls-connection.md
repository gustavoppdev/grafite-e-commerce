# 17 - Conexão TLS verificada com o banco

Status: open
Responsável: Claude
Blocked by: 16

## O que

- Configurar o adaptador `PrismaPg` para usar TLS **validando** o servidor com o certificado de `certs/supabase-ca.crt` (sem `rejectUnauthorized: false`).
- Garantir que o certificado chega à função serverless na Vercel (não depender de arquivo que o bundler possa deixar de fora).
- Conexão da CLI (migrations, `DIRECT_URL`) também criptografada.
- Comentários explicando TLS, autoridade certificadora e ataque *man-in-the-middle*.

## Critérios de aceite

- [ ] Conexão da aplicação: `encrypted = true` e `authorized = true` (certificado validado).
- [ ] Com um certificado errado, a conexão falha (prova de que a validação acontece).
- [ ] `/api/health` responde `ok` com SSL obrigatório ativo no Supabase.
- [ ] `pnpm build` passa.
