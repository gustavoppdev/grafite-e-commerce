import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env.schema";

// Nenhum teste encosta no `process.env`: a regra depende só do objeto recebido.

const valid = {
  NODE_ENV: "development",
  DATABASE_URL: "postgresql://user:pass@host:6543/postgres",
  BETTER_AUTH_URL: "http://localhost:3000",
  BETTER_AUTH_SECRET: "x".repeat(44),
};

// O erro do parse é uma string única com uma linha por variável; procurar o nome da
// variável é mais estável do que congelar a frase inteira.
function expectRejection(source: Record<string, string>, variable: string) {
  expect(() => parseServerEnv(source)).toThrow(variable);
}

describe("parseServerEnv", () => {
  it("accepts a valid development environment", () => {
    expect(parseServerEnv(valid).BETTER_AUTH_URL).toBe("http://localhost:3000");
  });

  it("defaults NODE_ENV to development when it is absent", () => {
    const { NODE_ENV: _omitted, ...withoutNodeEnv } = valid;
    expect(parseServerEnv(withoutNodeEnv).NODE_ENV).toBe("development");
  });

  describe("BETTER_AUTH_SECRET", () => {
    it("rejects a missing secret", () => {
      const { BETTER_AUTH_SECRET: _omitted, ...source } = valid;
      expectRejection(source, "BETTER_AUTH_SECRET");
    });

    it("rejects a secret shorter than the minimum", () => {
      expectRejection(
        { ...valid, BETTER_AUTH_SECRET: "x".repeat(31) },
        "BETTER_AUTH_SECRET",
      );
    });

    // Aceitar formatos diferentes é intencional: o mínimo é um piso contra o erro bobo,
    // não a impressão digital de um gerador específico (ver comentário no schema).
    it("accepts secrets from generators other than openssl base64", () => {
      const base64url = "abcdefghijklmnopqrstuvwxyz0123456789-_ABCDEF";
      const hex = "a".repeat(64);
      expect(() =>
        parseServerEnv({ ...valid, BETTER_AUTH_SECRET: base64url }),
      ).not.toThrow();
      expect(() =>
        parseServerEnv({ ...valid, BETTER_AUTH_SECRET: hex }),
      ).not.toThrow();
    });
  });

  describe("BETTER_AUTH_URL", () => {
    it("rejects a trailing slash", () => {
      expectRejection(
        { ...valid, BETTER_AUTH_URL: "http://localhost:3000/" },
        "BETTER_AUTH_URL",
      );
    });

    it("rejects a non-http protocol", () => {
      expectRejection(
        { ...valid, BETTER_AUTH_URL: "ftp://localhost:3000" },
        "BETTER_AUTH_URL",
      );
    });

    // A mesma URL passa ou falha só pelo NODE_ENV do objeto.
    it("requires https in production for a public host", () => {
      const source = { ...valid, BETTER_AUTH_URL: "http://grafite.example" };
      expect(() =>
        parseServerEnv({ ...source, NODE_ENV: "development" }),
      ).not.toThrow();
      expectRejection({ ...source, NODE_ENV: "production" }, "BETTER_AUTH_URL");
    });

    it("accepts https in production", () => {
      expect(() =>
        parseServerEnv({
          ...valid,
          NODE_ENV: "production",
          BETTER_AUTH_URL: "https://grafite.example",
        }),
      ).not.toThrow();
    });

    // Sem esta exceção, `pnpm build` e `pnpm typecheck` quebram na máquina de quem
    // desenvolve: eles rodam com NODE_ENV=production e .env apontando para localhost.
    it("accepts http on localhost even in a production build", () => {
      expect(() =>
        parseServerEnv({
          ...valid,
          NODE_ENV: "production",
          BETTER_AUTH_URL: "http://localhost:3000",
        }),
      ).not.toThrow();
    });
  });
});
