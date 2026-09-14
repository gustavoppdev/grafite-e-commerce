// Se este arquivo for importado por um Client Component, o build quebra.
// É a garantia de que a URL do banco nunca vai parar no JavaScript do navegador por engano.
import "server-only";
import { parseServerEnv } from "./env.schema";

// Validado uma vez, na primeira importação. O resto do código usa `env.DATABASE_URL`
// (tipado, garantido) em vez de `process.env.DATABASE_URL` (string | undefined).
export const env = parseServerEnv(process.env);
