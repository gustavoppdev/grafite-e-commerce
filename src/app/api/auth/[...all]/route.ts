import { toNextJsHandler } from "better-auth/next-js";
import { withMinimumDuration } from "@/lib/minimum-duration";
import { auth } from "@/server/auth";

// Rotas do better-auth. O roteador dele aplica checagem de origem e rate limit, por isso
// os formulários falam com esta rota (ADR 0005).
const handlers = toNextJsHandler(auth);

export const { GET } = handlers;

// Contra enumeração pelo tempo: sem o piso, "conta existe" respondia mais devagar (uma
// consulta a mais). O piso precisa ficar acima do caminho mais lento normal; conferido em
// produção com a função em gru1.
const MINIMUM_RESPONSE_MS = 800;

const PADDED_PATHS = new Set([
  "/api/auth/sign-in/email",
  "/api/auth/sign-up/email",
]);

export async function POST(request: Request) {
  if (!PADDED_PATHS.has(new URL(request.url).pathname)) {
    return handlers.POST(request);
  }
  return withMinimumDuration(() => handlers.POST(request), MINIMUM_RESPONSE_MS);
}
