import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/server/env";

// TLS validado contra a CA do Supabase (que não vem no sistema): sem validar, um
// man-in-the-middle apresentaria o próprio certificado. Nunca `rejectUnauthorized: false`.
// O `outputFileTracingIncludes` do next.config leva o arquivo para a Vercel.
const supabaseCa = readFileSync(
  join(process.cwd(), "certs", "supabase-ca.crt"),
  "utf8",
);

function createPrismaClient() {
  // DATABASE_URL = pooler do Supabase, que aguenta muitas funções serverless ao mesmo tempo.
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
    ssl: { ca: supabaseCa },

    /*
      O padrão do `pg` é esperar para sempre: uma query travada seguraria a conexão até a
      Vercel matar a função, e várias esgotariam o pool. `statement_timeout` não serve: o
      pooler em transaction mode ignora esse parâmetro vindo do cliente (testado).
    */
    connectionTimeoutMillis: 5_000,
    query_timeout: 10_000,
  });
  return new PrismaClient({ adapter });
}

// Em dev o hot reload recarrega módulos; guardar o cliente em `globalThis` evita abrir um
// pool novo a cada reload.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
