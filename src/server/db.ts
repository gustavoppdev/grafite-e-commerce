import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/server/env";

/*
  Cliente do banco. O arquivo se chama `db` e não `prisma` porque quem importa daqui
  quer "o banco", não "a biblioteca": se um dia o ORM mudar, muda este arquivo e não
  o import de cada chamador.

  Mora em `src/server/` — TODO arquivo desta pasta começa com `import "server-only"`.
  A pasta é a fronteira visível entre o que pode e o que não pode chegar ao navegador.
*/

/*
  Por que um "singleton" guardado em globalThis?

  Em desenvolvimento, cada vez que você salva um arquivo o Next recarrega os módulos.
  Um `new PrismaClient()` solto criaria um cliente novo (com seu pool de conexões)
  a cada reload, até esgotar o limite de conexões do banco. Guardando a instância em
  `globalThis`, que sobrevive ao reload, reaproveitamos sempre o mesmo cliente.
  Em produção os módulos carregam uma vez só, então não é necessário.
*/

/*
  TLS com validação do servidor.

  Sem `ssl`, o driver `pg` conecta em texto puro: senha e dados trafegam legíveis.
  Só ligar a criptografia não basta: sem VALIDAR o certificado, um atacante no meio
  do caminho (man-in-the-middle) pode apresentar um certificado próprio, e o cliente
  aceita. Por isso nunca usamos `rejectUnauthorized: false`.

  O certificado do Supabase é assinado pela autoridade (CA) do próprio Supabase, que não
  vem instalada no sistema. Passamos essa CA em `ca`: o driver só aceita um servidor cujo
  certificado tenha sido assinado por ela. O arquivo é público (não é segredo) e foi
  baixado pelo painel do Supabase. O `outputFileTracingIncludes` do next.config garante
  que ele seja copiado junto com as funções na Vercel.
*/
const supabaseCa = readFileSync(
  join(process.cwd(), "certs", "supabase-ca.crt"),
  "utf8",
);

function createPrismaClient() {
  // No Prisma 7 a conexão passa por um adaptador do driver `pg`. A aplicação usa a
  // DATABASE_URL: o pooler do Supabase, que aguenta muitas funções serverless abrindo
  // conexões ao mesmo tempo.
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
    ssl: { ca: supabaseCa },
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
