# 10 - Prisma + Supabase + `/api/health`

Status: open
Responsável: Claude
Blocked by: 09

## O que

- Instalar e configurar o Prisma seguindo a documentação **atual** para Supabase (pooler para runtime, conexão direta para migrations), lendo URLs do `env` validado.
- `src/lib/prisma.ts`: singleton com `server-only` (evita esgotar conexões com hot reload em desenvolvimento).
- Scripts: `db:generate`, `db:migrate`, `db:studio`; `postinstall` gerando o client (necessário na Vercel).
- `src/app/api/health/route.ts`: `SELECT 1`, responde `200 { status: "ok" }` ou `503 { status: "error" }`, sem cache e sem vazar a mensagem do erro.
- Comentários explicando o singleton, as duas URLs e por que a rota não expõe o erro.

## Critérios de aceite

- [ ] `pnpm build` gera o Prisma Client sem passos manuais.
- [ ] `/api/health` responde `ok` localmente.
- [ ] Com `DATABASE_URL` apontando para um banco inválido, responde 503 sem detalhes.
