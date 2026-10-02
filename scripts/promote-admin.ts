// Promove a Admin uma conta já cadastrada: `pnpm admin:promote <email>`.
// Script de operador, não tela: uma tela teria que funcionar sem Admin, ou seja, pública.
// Nunca toca em senha, e só sabe dar o papel "admin".
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { toRole } from "@/lib/roles";

// Outro processo: não importa `src/server/` (o `server-only` lançaria). Repete as garantias
// do `db.ts`: TLS validado e timeout.
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    fail("Uso: pnpm admin:promote <email>");
    return;
  }

  loadEnvConfig(process.cwd());

  // Credencial de operador, que não está na Vercel: tê-la é o que permite promover.
  const connectionString = process.env.DIRECT_URL;
  if (!connectionString) {
    fail("DIRECT_URL não está definida no .env (é a mesma das migrations).");
    return;
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      ssl: {
        ca: readFileSync(
          join(process.cwd(), "certs", "supabase-ca.crt"),
          "utf8",
        ),
      },
      connectionTimeoutMillis: 5_000,
    }),
  });

  try {
    await promote(prisma, email);
  } finally {
    await prisma.$disconnect();
  }
}

async function promote(prisma: PrismaClient, email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true, banned: true },
  });

  if (!user) {
    fail(
      `Nenhuma conta com o e-mail ${email}. Cadastre-se primeiro em /cadastro e rode de novo.`,
    );
    return;
  }

  // Admin bloqueado não conseguiria entrar; desbloquear é outra decisão.
  if (user.banned) {
    fail(`A conta ${user.email} está bloqueada. Nada foi alterado.`);
    return;
  }

  // Idempotente: quem já é Admin sai com sucesso, sem gravar.
  if (toRole(user.role) === "admin") {
    console.log(`${user.name} <${user.email}> já é Admin. Nada a fazer.`);
    await listAdmins(prisma);
    return;
  }

  // Contra erro de digitação, não contra atacante (quem roda já tem o banco).
  console.log("Conta encontrada:");
  console.log(`  nome:   ${user.name}`);
  console.log(`  e-mail: ${user.email}`);
  console.log(`  papel:  ${user.role ?? "(nenhum)"} → admin`);

  const confirmed = await ask("Para confirmar, digite o e-mail de novo: ");
  if (confirmed.trim().toLowerCase() !== user.email) {
    fail("E-mail diferente. Nada foi alterado.");
    return;
  }

  // Vale na próxima requisição: `requireAdmin` lê o papel do banco.
  await prisma.user.update({
    where: { id: user.id },
    data: { role: "admin" },
  });
  console.log(`Pronto: ${user.email} agora é Admin.`);
  await listAdmins(prisma);
}

// Lista todos os Admins no fim: uma conta inesperada salta aos olhos.
async function listAdmins(prisma: PrismaClient) {
  const candidates = await prisma.user.findMany({
    where: { role: { contains: "admin" } },
    select: { email: true, role: true },
    orderBy: { createdAt: "asc" },
  });
  // `contains` acha também "superadmin"; quem decide quem é Admin é o `toRole`.
  const admins = candidates.filter((u) => toRole(u.role) === "admin");
  console.log(`\nAdmins no banco (${admins.length}):`);
  for (const admin of admins) console.log(`  - ${admin.email}`);
}

async function ask(question: string) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await rl.question(question);
  } finally {
    rl.close();
  }
}

// Código 1 para `&&` não seguir como se tivesse dado certo.
function fail(message: string) {
  console.error(message);
  process.exitCode = 1;
}

main().catch((error: unknown) => {
  // Só a mensagem: o objeto do erro pode trazer a URL do banco, com a senha.
  console.error(
    "Falhou:",
    error instanceof Error ? error.message : "erro desconhecido",
  );
  process.exitCode = 1;
});
