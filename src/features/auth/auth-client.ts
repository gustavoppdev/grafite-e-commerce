import { createAuthClient } from "better-auth/react";

/*
  Cliente do better-auth para o NAVEGADOR: os formulários de entrar e cadastrar (tickets
  08 e 09) chamam `authClient.signIn.email(...)`, que vira um `fetch` para `/api/auth/*`.
  Esse é o caminho que passa pelo rate limit e pela checagem de origem (ADR 0005).

  Este arquivo NÃO importa nada de `src/server/`, nem para pegar um tipo: ele vai para o
  JavaScript do navegador, e `src/server/auth.ts` carrega o segredo do cookie e o cliente
  do banco. O `server-only` de lá quebraria o build se alguém tentasse.

  Sem `baseURL`: no navegador o cliente usa a origem da própria página, que é a mesma do
  `/api/auth`. Passar uma URL aqui exigiria uma variável `NEXT_PUBLIC_` só para repetir o
  que o navegador já sabe.

  Mora em `src/features/auth/` e não em `src/lib/` porque faz requisição: `lib/` é código
  puro, sem I/O.
*/
export const authClient = createAuthClient();
