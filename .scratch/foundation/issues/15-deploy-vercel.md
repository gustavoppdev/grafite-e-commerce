# 15 - Deploy na Vercel

Status: open
Responsável: Gustavo
Blocked by: 05, 07, 10, 12, 14, 17

## O que

Publicar a Fundação: repositório no GitHub, projeto na Vercel conectado a ele, variáveis de ambiente configuradas, e cada push na branch principal publicando automaticamente.

## Critérios de aceite

- [ ] Repositório no GitHub (privado ou público) com o código; `.env` **não** está no repositório.
- [ ] Projeto na Vercel importado do GitHub, build passando.
- [ ] `https://<seu-projeto>.vercel.app/` mostra a home com header/footer.
- [ ] `https://<seu-projeto>.vercel.app/api/health` responde `ok`.
- [ ] `/design-system` dá 404 na Vercel.
- [ ] Headers de segurança presentes na resposta da Vercel.

## Guia

- **Antes de subir:** rode `git log --stat` e `git status` e confira que nenhum `.env` com valor real foi commitado **em nenhum commit** (não só no último). Se foi, pare e me chame: apagar o arquivo não basta, o segredo continua no histórico e a senha do banco precisa ser trocada.
- **Branch:** o repositório local está em `master`. Decida se quer renomear para `main` antes do primeiro push (`git branch -m`). É mais fácil agora do que depois.
- **Criar o repositório:** pelo site do GitHub, **sem** README/.gitignore (o projeto já tem). Depois `git remote add origin ...` e `git push -u origin <branch>`.
- **Na Vercel:** "Add New Project" → importar o repositório. O framework é detectado sozinho. Pergunta: como a Vercel sabe que deve usar `pnpm`? (Dica: qual arquivo de lock existe no projeto?)
- **Variáveis de ambiente:** copie as chaves do `.env.example` e preencha na Vercel (Settings → Environment Variables). Qual das duas URLs do banco a aplicação usa em runtime? E a outra, precisa estar lá? Pense se as migrations vão rodar na Vercel ou na sua máquina.
- **Se o build falhar:** leia o log de build da Vercel de baixo para cima e procure a **primeira** mensagem de erro. Os suspeitos de sempre, em ordem: variável de ambiente faltando (o ticket 08 deve dar uma mensagem clara), Prisma Client não gerado (ticket 10, `postinstall`), senha com caractere especial não codificado na URL.
- **Se `/api/health` der 503 só na Vercel:** o problema é quase sempre a URL do pooler ou seus parâmetros. Compare com o que funcionou localmente.
- **Conferir headers:** DevTools → Network → clique no documento → Response Headers. Ou `curl -I https://<seu-projeto>.vercel.app`.
