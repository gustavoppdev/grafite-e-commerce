import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/config/auth";
import { INVALID_SIGN_UP_FIELDS } from "@/features/auth/errors";
import { signUpSchema } from "@/features/auth/schemas";
import { prisma } from "@/server/db";
import { env } from "@/server/env";

// Instância única do better-auth. Os formulários falam com ela por HTTP, nunca importando
// este arquivo (ADR 0005). O piso de tempo do login/cadastro fica no route handler.

// Usado no plugin e no usuário sintético: os dois não podem divergir.
const DEFAULT_ROLE = "user";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  // CSRF: requisições que mudam estado só são aceitas destas origens.
  trustedOrigins: [env.BETTER_AUTH_URL],

  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    // Os mesmos limites do formulário (`src/config/auth.ts`).
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,

    // Cadastro não faz login. É o que faz o cadastro de e-mail existente responder 200
    // genérico em vez de 422 (anti-enumeração).
    autoSignIn: false,

    // A resposta falsa precisa ser idêntica à real. Sem isto, ela sai com `role: null`
    // (contra `"user"` no cadastro de verdade) e entrega que a conta existe.
    customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
      ...coreFields,
      role: DEFAULT_ROLE,
      banned: false,
      banReason: null,
      banExpires: null,
      ...additionalFields,
      id,
    }),
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    // Sem cache em cookie: uma consulta por requisição (deduplicada por `cache()`) até
    // existir medição que justifique a otimização.
    cookieCache: { enabled: false },
  },

  // Cookie: os padrões já são `HttpOnly`, `Secure` (em https) e `SameSite=Lax`. `Lax` e não
  // `Strict` para quem chega por link externo não abrir a loja deslogado.

  rateLimit: {
    // O padrão é só em produção; ligado também em dev para ser testável.
    enabled: true,
    // No banco: em memória, cada instância da Vercel teria o próprio contador.
    // Não configurar `customStorage` junto: ele ganharia deste em silêncio.
    storage: "database",
    // Limite global (os padrões do código, a doc diverge). Login e cadastro têm a regra
    // embutida de 3 por 10s. O IP vem do `x-forwarded-for`, que a Vercel sobrescreve.
    window: 10,
    max: 100,
  },

  // Regras que a biblioteca não impõe no cadastro: `name` chega cru e `image` aceita
  // qualquer string. Roda no roteador, depois do rate limit, e também em `auth.api.*`.
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;

      if (ctx.body?.image !== undefined) {
        throw new APIError("BAD_REQUEST", {
          message: "image is not accepted on sign-up",
        });
      }

      // O mesmo schema do formulário. Diz quais campos falharam, nunca os valores.
      const parsed = signUpSchema.safeParse(ctx.body);
      if (!parsed.success) {
        const fields = [...new Set(parsed.error.issues.map((i) => i.path[0]))];
        throw new APIError("BAD_REQUEST", {
          code: INVALID_SIGN_UP_FIELDS,
          message: `invalid sign-up fields: ${fields.join(", ")}`,
        });
      }

      // Devolve o corpo normalizado, senão o banco grava o valor sem `trim`.
      return { context: { body: { ...ctx.body, ...parsed.data } } };
    }),
  },

  plugins: [
    admin({ defaultRole: DEFAULT_ROLE, adminRoles: ["admin"] }),
    // Por último: repassa ao Next os cookies que os outros passos gravaram.
    nextCookies(),
  ],
});
