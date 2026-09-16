import { z } from "zod";

/*
  Só variáveis de SERVIDOR. Nada aqui chega ao navegador.

  Se um dia precisarmos de uma variável no navegador, ela terá prefixo `NEXT_PUBLIC_`
  e ficará num schema separado. Atenção: o Next copia o VALOR de `NEXT_PUBLIC_*` para
  dentro do JavaScript enviado ao usuário no momento do build. Qualquer pessoa consegue
  ler. Por isso, segredo (senha, chave de API, URL do banco) nunca leva esse prefixo.

  Mora em `src/config/` e não em `src/server/` justamente porque NÃO pode ter "server-only":
  o `next.config.ts` (que roda fora do React) e os testes precisam importá-lo. Quem usa o
  `env` dentro do app importa de `@/server/env`, que é onde a proteção fica.
*/

const postgresUrl = z.url({
  protocol: /^postgres(ql)?$/,
  error: (issue) =>
    issue.input === undefined
      ? "obrigatória, mas não foi definida"
      : "deve ser uma URL de conexão postgresql://",
});

export const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  // Conexão via pooler (transaction mode) usada pela aplicação em runtime.
  DATABASE_URL: postgresUrl,
});

/*
  A `DIRECT_URL` (conexão direta, usada pelas migrations) NÃO está aqui de propósito.

  Cada consumidor valida o que ele próprio usa: a aplicação usa só o pooler, então só ele
  é obrigatório aqui. Quem precisa da conexão direta é a CLI do Prisma, e é o
  `prisma.config.ts` que a consome.

  Isso não é arrumação, é privilégio mínimo: a conexão direta fura o pooler e aceita
  comandos que ele recusa. Exigi-la aqui obrigaria a colocá-la também na Vercel, dando ao
  runtime uma credencial poderosa que ele nunca usa — e que vazaria junto em qualquer log
  ou erro que despeje o ambiente. Ela fica só na máquina de quem roda migration.
*/

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  source: Record<string, string | undefined>,
): ServerEnv {
  const result = serverEnvSchema.safeParse(source);

  if (!result.success) {
    // Mostra QUAL variável falhou e POR QUÊ, nunca o valor: a URL do banco contém
    // a senha, e logs de build ficam visíveis na Vercel, no CI, em prints de erro...
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Variáveis de ambiente inválidas:\n${problems}\n\nConfira o arquivo .env (modelo em .env.example).`,
    );
  }

  return result.data;
}
