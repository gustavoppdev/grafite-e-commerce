import { toNextJsHandler } from "better-auth/next-js";
import { withMinimumDuration } from "@/lib/minimum-duration";
import { auth } from "@/server/auth";

/*
  Todas as rotas do better-auth (`/api/auth/sign-up/email`, `/api/auth/get-session`...)
  entram por este catch-all e são despachadas pelo roteador dele. É nesse roteador que
  moram a checagem de origem (CSRF) e o rate limit — por isso os formulários de entrar e
  cadastrar falam com esta rota, e não chamam `auth.api.*` numa server action (ADR 0005).

  Sem cache: `GET` de route handler é dinâmico por padrão desde o Next 15, e resposta de
  sessão guardada em cache seria sessão de uma pessoa servida para outra.
*/
const handlers = toNextJsHandler(auth);

export const { GET } = handlers;

/*
  Enumeração pelo CRONÔMETRO (medido no ticket 07).

  O conteúdo das respostas já não diz se um e-mail tem conta: o login devolve o mesmo erro
  para "e-mail não existe" e "senha errada", e o cadastro devolve o mesmo sucesso para
  e-mail novo e repetido. Mas o TEMPO ainda dizia, medido localmente:
  - login: senha errada ~11ms mais lenta que e-mail inexistente (quando o usuário existe, o
    Prisma faz uma segunda consulta, para as contas dele);
  - cadastro: e-mail novo ~23ms mais lento que repetido (só o novo grava usuário e conta).
  Com algumas dezenas de tentativas por e-mail, a média separa os dois casos mesmo com a
  oscilação da rede. Em produção a diferença cresce: cada ida ao banco custa a distância
  entre a função e o Supabase.

  Por isso essas duas rotas sempre respondem em pelo menos `MINIMUM_RESPONSE_MS`, dando
  certo ou errado. O piso precisa ficar acima do caminho mais lento normal (localmente
  ~100ms); 800ms tem folga para a latência de produção e é imperceptível para quem está
  entrando. O ticket 15 confere o tempo real em produção.

  Custo: a espera não segura conexão de banco (a consulta já terminou), só a função aberta
  por mais alguns centésimos de segundo. E deixa força bruta um pouco mais lenta, de brinde.
*/
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
