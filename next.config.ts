import type { NextConfig } from "next";
import { parseServerEnv } from "./src/lib/env.schema";
import { securityHeaders } from "./src/lib/security-headers";

// O next.config roda ao iniciar `next dev` e `next build`, com o .env já carregado.
// Validar aqui faz o projeto falhar na hora, com mensagem clara, em vez de quebrar
// só quando alguém abrir uma página que usa o banco.
parseServerEnv(process.env);

const nextConfig: NextConfig = {
  reactCompiler: true,

  /*
    Remove o `X-Powered-By: Next.js` das respostas. Não fecha buraco nenhum sozinho,
    mas anunciar o framework e a versão entrega de graça a lista de CVEs a testar
    para quem está varrendo a internet atrás de alvo fácil.
  */
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

  // Na Vercel cada rota vira uma função que só recebe os arquivos que o Next detecta
  // como usados. Um arquivo lido com `readFileSync` pode passar despercebido, então
  // incluímos a CA do banco explicitamente em todas as rotas.
  outputFileTracingIncludes: {
    "/**": ["./certs/supabase-ca.crt"],
  },
};

export default nextConfig;
