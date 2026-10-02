import type { NextConfig } from "next";
import { parseServerEnv } from "./src/config/env.schema";
import { securityHeaders } from "./src/config/security-headers";

// Valida o env ao iniciar dev/build: falha cedo, com mensagem clara.
parseServerEnv(process.env);

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Sem `X-Powered-By`: não entrega framework e versão a quem varre atrás de CVE.
  poweredByHeader: false,

  // Os headers de segurança e o ataque que cada um mitiga estão em `security-headers.ts`.
  // `/(.*)` casa todas as rotas, incluindo `/api` e os arquivos estáticos.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Arquivo lido por `readFileSync` não é detectado pelo bundler: a CA vai explícita.
  outputFileTracingIncludes: {
    "/**": ["./certs/supabase-ca.crt"],
  },
};

export default nextConfig;
