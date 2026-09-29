-- Escrita à mão: o Prisma não modela privilégios. Nada aqui muda o schema.prisma.
--
-- O ataque: o Supabase expõe o schema `public` numa API REST (PostgREST) que responde à
-- chave `anon`, PÚBLICA por design. E o Supabase configura "default privileges" que dão
-- TODOS os privilégios (SELECT, INSERT, UPDATE, DELETE, TRUNCATE...) a `anon` e
-- `authenticated` em toda tabela nova criada em `public`. Conferido depois da migration
-- anterior: as quatro tabelas de auth e a `_prisma_migrations` nasceram assim.
--
-- O RLS da migration anterior bloqueia linhas, mas não tudo: TRUNCATE ignora RLS, e a
-- `_prisma_migrations` nem tinha RLS. A loja não usa a API REST do Supabase para nada: o
-- único cliente do banco é o Prisma, conectado como `postgres`. Então esses dois papéis
-- não precisam de privilégio NENHUM em `public`.
--
-- 1. Tira o que já foi dado às tabelas que existem hoje, inclusive a `_prisma_migrations`
--    (ela é criada pelo Prisma ANTES de qualquer migration rodar, então está sempre aqui).
--    Não dá para ligar RLS nela por migration: o `migrate dev` testa cada migration num
--    banco temporário ("shadow database") que não tem essa tabela, e o ALTER falharia.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- 2. Corta na origem: tabelas, sequências e funções que o `postgres` criar daqui para
--    frente (toda migration futura) nascem SEM privilégio para esses papéis. Sem isto, cada
--    migration nova reabriria o buraco e dependeria de alguém lembrar de fechar.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
