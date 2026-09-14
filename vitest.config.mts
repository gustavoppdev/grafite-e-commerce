import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Lê o `paths` do tsconfig.json, então `@/lib/format` funciona nos testes igual ao app.
    tsconfigPaths: true,
  },
  test: {
    // Regras de negócio rodam em Node puro, sem simular navegador: testes mais rápidos.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
