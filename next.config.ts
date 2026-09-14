import type { NextConfig } from "next";
import { parseServerEnv } from "./src/lib/env.schema";

// O next.config roda ao iniciar `next dev` e `next build`, com o .env já carregado.
// Validar aqui faz o projeto falhar na hora, com mensagem clara, em vez de quebrar
// só quando alguém abrir uma página que usa o banco.
parseServerEnv(process.env);

const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default nextConfig;
