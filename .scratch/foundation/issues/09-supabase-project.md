# 09 - Criar projeto no Supabase e preencher `.env`

Status: resolved
Responsável: Gustavo
Blocked by: 08

## O que

Criar o banco Postgres no Supabase e colocar as duas URLs de conexão no `.env` local.

## Critérios de aceite

- [ ] Projeto criado no Supabase, na região mais próxima (São Paulo, se disponível).
- [ ] `.env` com `DATABASE_URL` e `DIRECT_URL` preenchidas; `pnpm dev` sobe sem erro de env (ticket 08).
- [ ] Senha do banco salva num gerenciador de senhas, não num arquivo do projeto.
- [ ] `git status` **não** mostra o `.env`.

## Guia

- **Senha do banco:** use o gerador do próprio Supabase (senha longa). Evite caracteres especiais que precisem de escape em URL, ou lembre que eles precisam ser *URL-encoded* dentro da connection string. Esse é um erro clássico que parece "senha errada".
- **Onde achar as URLs:** no painel do projeto, procure o botão/seção **Connect**. Você vai ver mais de um tipo de conexão. Leia a descrição de cada um e responda:
  - Qual é a do **pooler em transaction mode** (normalmente porta `6543`)? Essa vai em `DATABASE_URL`, usada pela aplicação.
  - Qual é a **direta ou session mode** (normalmente porta `5432`)? Essa vai em `DIRECT_URL`, usada pelas migrations.
- **Por que duas?** Na Vercel cada requisição pode rodar numa função serverless nova, e cada uma abriria uma conexão. O Postgres tem limite de conexões; o pooler reaproveita. Mas migrations precisam de recursos que o transaction mode não suporta. Anote essa explicação com suas palavras no commit ou num comentário do `.env.example`.
- **Parâmetros da URL do pooler:** a documentação do Prisma para Supabase indica parâmetros extras na URL do pooler (ex. para desligar prepared statements). Confira na doc atual antes de salvar. O ticket 10 vai depender disso.
- **Conferir o `.env.example`:** as chaves que você preencheu devem ser exatamente as listadas lá.
- **Armadilha:** não use a URL/chave da API REST do Supabase (`anon key`, `service_role`). Decidimos usar o Supabase **só como Postgres**.
