import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "./env";

/*
  Por que um "singleton" guardado em globalThis?

  Em desenvolvimento, cada vez que você salva um arquivo o Next recarrega os módulos.
  Um `new PrismaClient()` solto criaria um cliente novo (com seu pool de conexões)
  a cada reload, até esgotar o limite de conexões do banco. Guardando a instância em
  `globalThis`, que sobrevive ao reload, reaproveitamos sempre o mesmo cliente.
  Em produção os módulos carregam uma vez só, então não é necessário.
*/

function createPrismaClient() {
  // No Prisma 7 a conexão passa por um adaptador do driver `pg`. A aplicação usa a
  // DATABASE_URL: o pooler do Supabase, que aguenta muitas funções serverless abrindo
  // conexões ao mesmo tempo.
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
