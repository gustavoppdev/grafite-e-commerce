import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// O Prisma 7 não lê o .env sozinho. Usamos o mesmo carregador do Next, então
// a CLI do Prisma e o app enxergam exatamente as mesmas variáveis.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    /*
      Esta URL é só da CLI (migrate, studio). Migrations precisam da conexão DIRETA:
      o pooler em transaction mode reaproveita a mesma conexão entre clientes
      diferentes e não suporta os comandos que uma migration executa.

      `?? ""` em vez de exigir a variável: na Vercel o `prisma generate` roda na
      instalação e não precisa de banco, então a DIRECT_URL nem existe lá.
    */
    url: process.env.DIRECT_URL ?? "",
  },
});
