import { authErrorMessage } from "./errors";

// Chamada do `authClient` com o tratamento comum às duas telas: frase de erro ou `null`.

// O `fetch` não tem limite próprio: sem isto, o botão ficaria preso se o servidor travasse.
// Repetir depois de desistir é inofensivo (login cria outra sessão; cadastro é idempotente
// na resposta).
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
