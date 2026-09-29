import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/auth";

/*
  Todas as rotas do better-auth (`/api/auth/sign-up/email`, `/api/auth/get-session`...)
  entram por este catch-all e são despachadas pelo roteador dele. É nesse roteador que
  moram a checagem de origem (CSRF) e o rate limit — por isso os formulários de entrar e
  cadastrar falam com esta rota, e não chamam `auth.api.*` numa server action (ADR 0005).

  Sem cache: `GET` de route handler é dinâmico por padrão desde o Next 15, e resposta de
  sessão guardada em cache seria sessão de uma pessoa servida para outra.
*/
export const { GET, POST } = toNextJsHandler(auth);
