import type { NextConfig } from "next";
import { parseServerEnv } from "./src/lib/env.schema";

// O next.config roda ao iniciar `next dev` e `next build`, com o .env já carregado.
// Validar aqui faz o projeto falhar na hora, com mensagem clara, em vez de quebrar
// só quando alguém abrir uma página que usa o banco.
parseServerEnv(process.env);

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Na Vercel cada rota vira uma função que só recebe os arquivos que o Next detecta
  // como usados. Um arquivo lido com `readFileSync` pode passar despercebido, então
  // incluímos a CA do banco explicitamente em todas as rotas.
  outputFileTracingIncludes: {
    "/**": ["./certs/supabase-ca.crt"],
  },
};

export default nextConfig;
