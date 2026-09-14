# 16 - Certificado SSL do Supabase e SSL obrigatório

Status: open
Responsável: Gustavo
Blocked by: 10

## Contexto

No ticket 10 descobrimos que a conexão da aplicação com o Supabase **não usa TLS**: senha e dados trafegam em texto puro. Ao ligar TLS com validação, o Node recusa o certificado (`SELF_SIGNED_CERT_IN_CHAIN`), porque ele é assinado pela autoridade própria do Supabase ("Supabase Root 2021 CA"), que não vem instalada no sistema.

## O que

1. Baixar o **certificado raiz** do Supabase pelo painel do seu projeto e salvar em `certs/supabase-ca.crt` na raiz do repositório.
2. Ativar no painel a opção que **obriga conexões com SSL** (recusa conexões sem criptografia).

## Critérios de aceite

- [ ] Arquivo `certs/supabase-ca.crt` existe e começa com `-----BEGIN CERTIFICATE-----`.
- [ ] O certificado é o "Supabase Root 2021 CA" (ver Guia para conferir).
- [ ] SSL obrigatório ativado no projeto.
- [ ] `/api/health` continua respondendo `ok` localmente depois de ativar (se quebrar, é esperado até o ticket 17; anote a mensagem de erro).

## Guia

- **Onde fica:** nas configurações do projeto, seção de **Database**, procure "SSL Configuration". Lá há o botão de download do certificado e a opção de *enforcement* (obrigatoriedade).
- **Por que baixar do painel, e não pegar da própria conexão?** O painel é acessado por HTTPS, com um certificado validado pelo navegador, então você sabe que o arquivo veio do Supabase. Se copiássemos o certificado que o servidor apresenta na conexão com o banco, e essa conexão estivesse sendo interceptada, passaríamos a confiar no certificado do atacante.
- **Esse arquivo é segredo?** Não. É um certificado **público** de autoridade: serve para *verificar* o servidor, não para se autenticar. Pode e deve ir para o git. Pergunta para pensar: qual a diferença entre este `.crt` e a senha que está no `.env`?
- **Conferir o conteúdo:** rode `openssl x509 -in certs/supabase-ca.crt -noout -subject -issuer -enddate`. O `subject` deve mencionar "Supabase Root 2021 CA". Note que `subject` e `issuer` são iguais: é isso que torna um certificado "raiz" (ele assina a si mesmo).
- **Ordem sugerida:** baixe o certificado **antes** de ativar o SSL obrigatório. Depois de ativar, observe se o `/api/health` quebra. Pense no porquê antes de ler o ticket 17.
