-- CreateTable
CREATE TABLE "rateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "rateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rateLimit_key_key" ON "rateLimit"("key");

-- ─── Escrito à mão (o Prisma não modela RLS) ─────────────────────────────────────
-- Mesma regra da `auth_tables`: toda tabela nova em `public` liga RLS. Aqui o estrago
-- seria específico: pela API REST do Supabase, quem tivesse a chave `anon` (pública)
-- leria IPs de quem tentou entrar e, pior, APAGARIA a própria linha para zerar o contador
-- e continuar tentando senhas sem limite.
-- Os privilégios de `anon`/`authenticated` já nascem zerados (`lock_down_data_api`), então
-- isto é a segunda camada: se um dia alguém der GRANT por engano, o RLS ainda nega tudo.
ALTER TABLE "rateLimit" ENABLE ROW LEVEL SECURITY;
