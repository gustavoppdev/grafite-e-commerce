import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// O Prisma 7 não lê o .env sozinho. Usamos o mesmo carregador do Next, então
// a CLI do Prisma e o app enxergam exatamente as mesmas variáveis.
loadEnvConfig(process.cwd());

// A CLI tem parâmetros de SSL próprios: `sslmode=verify-full` é ignorado (conecta até com a
// CA errada). `sslaccept=strict` com a CA valida de verdade (testado).
function withVerifiedTls(url: string | undefined) {
  if (!url) {
    // Na Vercel o `prisma generate` roda na instalação e não precisa de banco,
    // então a DIRECT_URL nem existe lá.
    return "";
  }
  const withTls = new URL(url);
  withTls.searchParams.set("sslmode", "require");
  withTls.searchParams.set(
    "sslcert",
    join(process.cwd(), "certs", "supabase-ca.crt"),
  );
  withTls.searchParams.set("sslaccept", "strict");
  return withTls.toString();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations precisam da conexão DIRETA: o pooler em transaction mode reaproveita
    // a mesma conexão entre clientes diferentes e não suporta o que uma migration executa.
    url: withVerifiedTls(process.env.DIRECT_URL),
  },
});
