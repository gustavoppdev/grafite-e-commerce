# 15 - Deploy na Vercel

Status: resolved
Responsável: Gustavo
Blocked by: 05, 07, 10, 12, 14, 17

## O que

Publicar a Fundação: repositório no GitHub, projeto na Vercel conectado a ele, variáveis de ambiente configuradas, e cada push na branch principal publicando automaticamente.

## Critérios de aceite

- [x] Repositório no GitHub (privado ou público) com o código; `.env` **não** está no repositório.
- [x] Projeto na Vercel importado do GitHub, build passando.
- [x] `https://<seu-projeto>.vercel.app/` mostra a home com header/footer.
- [x] `https://<seu-projeto>.vercel.app/api/health` responde `ok`.
- [x] `/design-system` dá 404 na Vercel.
- [x] Headers de segurança presentes na resposta da Vercel.

## Guia

- **Antes de subir:** rode `git log --stat` e `git status` e confira que nenhum `.env` com valor real foi commitado **em nenhum commit** (não só no último). Se foi, pare e me chame: apagar o arquivo não basta, o segredo continua no histórico e a senha do banco precisa ser trocada.
- **Branch:** o repositório local está em `master`. Decida se quer renomear para `main` antes do primeiro push (`git branch -m`). É mais fácil agora do que depois.
- **Criar o repositório:** pelo site do GitHub, **sem** README/.gitignore (o projeto já tem). Depois `git remote add origin ...` e `git push -u origin <branch>`.
- **Na Vercel:** "Add New Project" → importar o repositório. O framework é detectado sozinho. Pergunta: como a Vercel sabe que deve usar `pnpm`? (Dica: qual arquivo de lock existe no projeto?)
- **Variáveis de ambiente:** copie as chaves do `.env.example` e preencha na Vercel (Settings → Environment Variables). Qual das duas URLs do banco a aplicação usa em runtime? E a outra, precisa estar lá? Pense se as migrations vão rodar na Vercel ou na sua máquina.
- **Se o build falhar:** leia o log de build da Vercel de baixo para cima e procure a **primeira** mensagem de erro. Os suspeitos de sempre, em ordem: variável de ambiente faltando (o ticket 08 deve dar uma mensagem clara), Prisma Client não gerado (ticket 10, `postinstall`), senha com caractere especial não codificado na URL.
- **Se `/api/health` der 503 só na Vercel:** o problema é quase sempre a URL do pooler ou seus parâmetros. Compare com o que funcionou localmente.
- **Conferir headers:** DevTools → Network → clique no documento → Response Headers. Ou `curl -I https://<seu-projeto>.vercel.app`.

## Comments

No ar em **https://grafite-five.vercel.app** com apenas `DATABASE_URL` configurada na Vercel
(ver o commit que tirou a `DIRECT_URL` do schema da aplicação).

Verificado em produção:

- `/api/health` responde `{"status":"ok"}` — Prisma, pooler e TLS verificado funcionando.
- `/design-system` responde 404; `/` responde 200.
- Os 6 headers de segurança presentes em `/`, `/api/health`, `/design-system` e numa rota
  inexistente. `x-powered-by` ausente.
- A CSP está na variante de PRODUÇÃO: sem `'unsafe-eval'`, sem `ws:`, com
  `upgrade-insecure-requests` — as três diferenças previstas no ticket 12.
- CSP testada ativamente no site no ar, não só lida no header: `fetch` para domínio externo,
  `<script>` de CDN e `<base href>` hostil, os três bloqueados. Fonte do `next/font` carregada.

**Anotado para a Feature 1:** as respostas servidas do cache estático da Vercel (home e 404)
trazem `access-control-allow-origin: *`, adicionado pelo CDN deles, não por nós (o
`/api/health` não tem). Hoje é inofensivo — as páginas são públicas e o navegador proíbe
combinar `*` com envio de cookie — mas precisa ser reconferido quando existirem páginas
autenticadas.
