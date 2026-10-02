/*
  Promove uma conta JÁ CADASTRADA a Administrador.

    pnpm admin:promote <email>

  Por que isto é um script e não uma tela: uma tela que cria o primeiro Admin precisaria
  funcionar SEM sessão de Admin (senão ninguém a usaria da primeira vez), ou seja, seria
  uma rota pública que cria superusuário. Quem achasse a URL antes de nós viraria dono da
  loja. Criar Admin é tarefa de OPERADOR, de quem já tem acesso ao banco, e por isso roda
  aqui, no terminal: não é rota, não é server action, nada disto é alcançável por HTTP.

  Promover, e não criar (decisão da spec): a pessoa se cadastra por `/cadastro` como
  qualquer Cliente, e este script só troca o `role`. Ele nunca toca em senha, então não
  pode errar o hash nem deixar senha no histórico do shell ou no `ps`. (A CLI oficial,
  `auth create-admin`, cria a conta e recebe a senha por `--password`: foi descartada por
  isso, ver ticket 14.)

  Seguro por estar no SEU terminal, não por ser esperto: quem consegue rodar isto já tem a
  `DIRECT_URL`, a credencial que manda no banco inteiro. Por isso o script só sabe fazer
  UMA coisa (dar o papel "admin"); não aceita papel vindo de argumento.
*/
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { toRole } from "@/lib/roles";

/*
  Este arquivo NÃO importa nada de `src/server/` (o `prisma` de lá, o `auth`). Não é para
  furar a regra: `server-only` é uma proteção de BUNDLE do Next, e este é outro processo,
  um Node comum, que não faz bundle nenhum. Importar `src/server/db.ts` daqui lançaria o
  erro do `server-only` (o mesmo que barrou a CLI do better-auth no ticket 04).

  Então a conexão é montada aqui, repetindo as duas garantias do `src/server/db.ts`: TLS
  validado com a CA do Supabase (nunca `rejectUnauthorized: false`) e timeout de conexão.
*/
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    fail("Uso: pnpm admin:promote <email>");
    return;
  }

  // O mesmo carregador do Next e do `prisma.config.ts`: as três leituras do `.env` batem.
  loadEnvConfig(process.cwd());

  /*
    `DIRECT_URL`, não `DATABASE_URL`. Promover Admin é tarefa de operador, como migration,
    e roda com a credencial de operador, que só existe nesta máquina (ela fica fora da
    Vercel de propósito, ver `env.schema.ts`). Ter a `DIRECT_URL` é exatamente o que
    separa quem pode promover de quem não pode.
  */
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
  // O better-auth grava e-mail em minúsculas; por isso o `toLowerCase` lá em cima.
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true, banned: true },
  });

  /*
    O custo de promover em vez de criar: a conta precisa existir antes. Falhar com o
    caminho escrito é o comportamento certo; criar uma conta aqui seria reabrir a decisão.
  */
  if (!user) {
    fail(
      `Nenhuma conta com o e-mail ${email}. Cadastre-se primeiro em /cadastro e rode de novo.`,
    );
    return;
  }

  // Promover conta bloqueada daria um Admin que não consegue entrar. Se for isso mesmo,
  // desbloquear é uma decisão separada, tomada antes e de propósito.
  if (user.banned) {
    fail(`A conta ${user.email} está bloqueada. Nada foi alterado.`);
    return;
  }

  // Rodar duas vezes não muda nada: quem já é Admin sai com sucesso, sem gravar.
  if (toRole(user.role) === "admin") {
    console.log(`${user.name} <${user.email}> já é Admin. Nada a fazer.`);
    await listAdmins(prisma);
    return;
  }

  /*
    Confirmação: mostra QUEM vai ser promovido e pede o e-mail digitado de novo. Não é
    contra atacante (quem roda isto já tem o banco), é contra o erro de digitação que
    promove a pessoa errada.
  */
  console.log("Conta encontrada:");
  console.log(`  nome:   ${user.name}`);
  console.log(`  e-mail: ${user.email}`);
  console.log(`  papel:  ${user.role ?? "(nenhum)"} → admin`);

  const confirmed = await ask("Para confirmar, digite o e-mail de novo: ");
  if (confirmed.trim().toLowerCase() !== user.email) {
    fail("E-mail diferente. Nada foi alterado.");
    return;
  }

  /*
    Vale na próxima requisição, sem precisar sair e entrar: o `requireAdmin` lê o papel do
    banco a cada requisição (o cache de sessão em cookie está desligado, ticket 03).
  */
  await prisma.user.update({
    where: { id: user.id },
    data: { role: "admin" },
  });
  console.log(`Pronto: ${user.email} agora é Admin.`);
  await listAdmins(prisma);
}

/*
  Termina sempre mostrando TODOS os Admins. Admin a mais é o tipo de coisa que ninguém vê
  até ser tarde; impressa aqui, uma conta inesperada na lista salta aos olhos.
*/
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

// Sai com código 1: quem encadear o comando (`&&`) não segue como se tivesse dado certo.
function fail(message: string) {
  console.error(message);
  process.exitCode = 1;
}

main().catch((error: unknown) => {
  /*
    Só a mensagem, nunca o objeto inteiro: erro de conexão pode trazer a URL do banco, e
    ela contém a senha.
  */
  console.error(
    "Falhou:",
    error instanceof Error ? error.message : "erro desconhecido",
  );
  process.exitCode = 1;
});
