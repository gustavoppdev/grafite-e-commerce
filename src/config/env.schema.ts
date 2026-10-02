import { z } from "zod";

// Só variáveis de servidor. Variável de navegador levaria `NEXT_PUBLIC_` e iria para o
// bundle: segredo nunca. Mora em `config/` (sem `server-only`) porque o `next.config.ts` e os
// testes também importam; o app importa de `@/server/env`.

const postgresUrl = z.url({
  protocol: /^postgres(ql)?$/,
  error: (issue) =>
    issue.input === undefined
      ? "obrigatória, mas não foi definida"
      : "deve ser uma URL de conexão postgresql://",
});

// Aceita http e https; exigir https em produção depende do `NODE_ENV` e fica no
// `.superRefine` abaixo.
const betterAuthUrl = z
  .url({
    protocol: /^https?$/,
    error: (issue) =>
      issue.input === undefined
        ? "obrigatória, mas não foi definida"
        : "deve ser uma URL http:// ou https://",
  })
  // Barra no fim viraria `//api/auth`. O `z.url()` não normaliza a string.
  .refine((url) => !url.endsWith("/"), {
    error: "não pode terminar com barra",
  });

// Assina o cookie de sessão: com ela, dá para forjar sessão de qualquer um. Só um mínimo,
// contra o erro bobo: nenhuma regex mede entropia, e formato exato recusaria chaves mais
// fortes (64 bytes, base64url).
const betterAuthSecret = z
  .string({
    error: (issue) =>
      issue.input === undefined
        ? "obrigatória, mas não foi definida"
        : "deve ser um texto",
  })
  .min(
    32,
    "deve ter no mínimo 32 caracteres (gere com `openssl rand -base64 32`)",
  );

export const serverEnvSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    // Pooler (transaction mode), usado pela aplicação em runtime.
    DATABASE_URL: postgresUrl,
    BETTER_AUTH_URL: betterAuthUrl,
    BETTER_AUTH_SECRET: betterAuthSecret,
  })
  /*
    Em produção, https obrigatório (em http o cookie de sessão trafega legível). A regra
    olha dois campos, por isso mora no objeto, onde o `NODE_ENV` já chega validado e com o
    default aplicado; ler `process.env` aqui tornaria a regra impura e impossível de testar.

    `NODE_ENV === "production"` quer dizer "compilado em modo produção", o que inclui o
    `pnpm build` local: daí a exceção para endereços que não saem da máquina.
  */
  .superRefine((env, ctx) => {
    const localHosts = ["localhost", "127.0.0.1", "[::1]"];
    const { protocol, hostname } = new URL(env.BETTER_AUTH_URL);

    if (
      env.NODE_ENV === "production" &&
      protocol === "http:" &&
      !localHosts.includes(hostname)
    ) {
      ctx.addIssue({
        code: "custom",
        // Sem `path`, a mensagem sairia sem o nome da variável.
        path: ["BETTER_AUTH_URL"],
        message:
          "em produção precisa ser https:// (o cookie de sessão viaja nela)",
      });
    }
  });

// A `DIRECT_URL` (migrations) não está aqui de propósito: privilégio mínimo. A aplicação só
// usa o pooler, e exigi-la levaria uma credencial poderosa para a Vercel sem uso.

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  source: Record<string, string | undefined>,
): ServerEnv {
  const result = serverEnvSchema.safeParse(source);

  if (!result.success) {
    // Nome da variável e motivo, nunca o valor: a URL do banco contém a senha.
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Variáveis de ambiente inválidas:\n${problems}\n\nConfira o arquivo .env (modelo em .env.example).`,
    );
  }

  return result.data;
}
