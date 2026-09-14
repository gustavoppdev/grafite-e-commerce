# 08 - Validação de variáveis de ambiente

Status: open
Responsável: Claude
Blocked by: 01

## O que

- `src/lib/env.ts` com `server-only`: schema Zod para as variáveis do servidor (`DATABASE_URL`, `DIRECT_URL`, `NODE_ENV`), validado uma vez e exportado tipado.
- Mensagem de erro listando **quais** variáveis falharam, sem imprimir os valores (segredos em log são vazamento).
- Separação clara entre variáveis de servidor e `NEXT_PUBLIC_*` (nenhuma pública por enquanto), com comentário explicando que `NEXT_PUBLIC_` vai parar no JavaScript do navegador.
- `.env.example` com todas as chaves e comentários de onde obter cada uma (sem valores reais).
- Garantir que o build/dev falha cedo com env inválida.

## Critérios de aceite

- [ ] Remover `DATABASE_URL` do `.env` faz o app falhar com mensagem clara.
- [ ] Importar `env` num client component quebra o build (proteção do `server-only`).
- [ ] O resto do código usa `env.X`, nunca `process.env.X` diretamente.
