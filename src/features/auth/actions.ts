"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

/*
  Sair é a ÚNICA operação de autenticação que passa por server action. Entrar e cadastrar
  vão pelo `authClient` porque o rate limit do better-auth mora no roteador HTTP, e uma
  action pularia o limite (ADR 0005). Sair não precisa de limite: o pior que alguém consegue
  repetindo a chamada é deslogar a si mesmo.

  E a action tem duas vantagens aqui:
  - O `<form action={signOutAction}>` funciona como um formulário comum: o navegador envia,
    o servidor apaga a sessão e redireciona.
  - O `redirect()` de dentro de uma action devolve a página nova já renderizada SEM a
    sessão, então o header troca para "Entrar" na mesma resposta, sem `router.refresh()`.

  Proteção contra CSRF (um site de fora fazendo o navegador da vítima chamar esta action):
  o Next só aceita a chamada de uma action quando o `Origin` da requisição bate com o host
  do site. Aqui o estrago seria pequeno (deslogar alguém), mas a proteção vem de graça.
*/
export async function signOutAction() {
  /*
    O better-auth apaga a sessão no banco e manda apagar o cookie. O plugin `nextCookies()`
    (o último da lista em `src/server/auth.ts`) é quem repassa esse "apague o cookie" para a
    resposta do Next; sem ele, o cookie continuaria no navegador.

    Sem sessão, a chamada não lança erro: não há o que encerrar, e ela só apaga o cookie.
    Por isso não há `try/catch`, e o `redirect()` fica fora de qualquer `try` de qualquer
    jeito, porque ele funciona lançando um erro que o Next intercepta.
  */
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
