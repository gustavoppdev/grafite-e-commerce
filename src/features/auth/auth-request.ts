import { authErrorMessage } from "./errors";

/*
  Uma chamada do `authClient` (login, cadastro), com o tratamento que as duas telas
  precisam igual. Devolve a frase de erro em pt-BR, ou `null` quando deu certo.

  Por que os formulários de auth chamam o `authClient`, e não uma server action como o resto
  do projeto: o rate limit do better-auth mora no roteador HTTP de `/api/auth/*`. Uma action
  chamando `auth.api.*` pularia o limite e deixaria a força bruta livre (ADR 0005).
*/

/*
  Tempo máximo de espera no navegador. O `fetch` não tem limite próprio: se o servidor
  travar, o botão ficaria em "Entrando..." por minutos. 15s cobre com folga o caminho normal
  (o piso de 800ms + as consultas, que o próprio servidor corta em 10s).

  Desistir aqui não cancela nada no servidor. Se o pedido tiver dado certo depois, a nova
  tentativa é inofensiva: o login só cria outra sessão, e o cadastro repetido devolve o
  mesmo sucesso genérico.
*/
const REQUEST_TIMEOUT_MS = 15_000;

type AuthCall = (fetchOptions: {
  timeout: number;
}) => Promise<{ error: { code?: string; status: number } | null }>;

export async function authRequest(call: AuthCall): Promise<string | null> {
  try {
    const { error } = await call({ timeout: REQUEST_TIMEOUT_MS });
    return error ? authErrorMessage(error) : null;
  } catch {
    // Sem resposta nenhuma: a rede caiu ou o tempo acabou. Nesses casos o `fetch` LANÇA em
    // vez de devolver `error`, e sem este `catch` o botão ficaria preso no estado de envio.
    return authErrorMessage({ status: 0 });
  }
}
