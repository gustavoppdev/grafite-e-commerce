import type { ADMIN_ERROR_CODES } from "better-auth/client/plugins";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/config/auth";
import type { authClient } from "./auth-client";

/*
  Traduz o erro do better-auth para a frase que a pessoa lê no formulário (tickets 08 e 09).
  Nunca mostra a `message` da biblioteca: ela vem em inglês e, num erro inesperado, pode
  carregar detalhe interno (a regra do `fail()` em `src/lib/action-result.ts`).
*/

/*
  Código que o NOSSO hook de cadastro devolve (`src/server/auth.ts`). Exportado daqui para o
  servidor usar a mesma string: se um lado mudasse, o formulário cairia na mensagem genérica.
*/
export const INVALID_SIGN_UP_FIELDS = "INVALID_SIGN_UP_FIELDS";

/*
  De onde vêm os códigos: dos TIPOS da versão instalada, não de strings soltas.
  - `authClient.$ERROR_CODES`: os códigos do núcleo (`@better-auth/core/error`).
  - `ADMIN_ERROR_CODES`: os do plugin admin (`BANNED_USER`), que o cliente não conhece
    porque não usamos `adminClient()`.
  Os dois imports são `import type`: somem no build, nada vai para o navegador.

  O `$ERROR_CODES` só existe no tipo. Em tempo de execução é um proxy que monta chamadas de
  API, não a lista (conferido na 1.7.6), por isso não dá para ler os códigos dele.

  O ganho: o mapa abaixo só aceita chave que existe na biblioteca. Um erro de digitação, ou
  um código renomeado numa atualização, quebra o `pnpm typecheck` em vez de cair calado na
  mensagem genérica.
*/
type AuthErrorCode =
  | keyof typeof authClient.$ERROR_CODES
  | keyof typeof ADMIN_ERROR_CODES
  | typeof INVALID_SIGN_UP_FIELDS;

/*
  ATENÇÃO, antes de acrescentar uma mensagem "para ajudar":

  - Não existe "este e-mail já está cadastrado". Com `autoSignIn: false`, o cadastro com
    e-mail repetido responde o mesmo sucesso que um cadastro novo, e o código
    `USER_ALREADY_EXISTS` nem chega aqui. Se um dia chegar, cai na genérica de propósito: a
    mensagem específica transformaria o cadastro numa consulta de "quem tem conta na loja".

  - O login tem UMA mensagem para e-mail inexistente e senha errada, porque a biblioteca
    devolve um código só para os dois. Separar em "e-mail não encontrado" faria o mesmo
    estrago, agora no login. O que a pessoa perde (não saber que errou o e-mail) a
    recuperação de senha da Feature 2 devolve, sem expor ninguém.

  - Conta bloqueada não explica o motivo. O `banReason` é anotação interna do Admin e pode
    conter qualquer coisa. E esta mensagem não vira enumeração: o better-auth só confere o
    bloqueio DEPOIS de a senha bater (verificado), então só quem já sabe a senha a vê.
*/
const MESSAGES: Partial<Record<AuthErrorCode, string>> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha incorretos.",
  BANNED_USER: "Sua conta está bloqueada.",
  INVALID_EMAIL: "Digite um e-mail válido.",
  PASSWORD_TOO_SHORT: `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`,
  PASSWORD_TOO_LONG: `A senha pode ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
  // O formulário valida o mesmo schema antes de enviar; chegar aqui é raro.
  INVALID_SIGN_UP_FIELDS: "Confira os dados do cadastro.",
};

/*
  O 429 do rate limit não tem `code`, só o status (conferido em `api/rate-limiter`). Por
  isso ele é decidido pelo status, antes de olhar o código.
*/
const TOO_MANY_REQUESTS =
  "Muitas tentativas seguidas. Aguarde um pouco e tente de novo.";

/*
  Para qualquer código que não está no mapa: um código novo numa atualização, a recusa de
  origem (CSRF), um erro 500. A pessoa recebe uma frase útil e nada da biblioteca.
*/
const FALLBACK = "Não foi possível concluir agora. Tente de novo em instantes.";

/*
  Recebe só o que usa, e não o objeto de erro inteiro do cliente: no teste, a entrada é
  um objeto de duas chaves.
*/
export function authErrorMessage(error: {
  code?: string;
  status: number;
}): string {
  if (error.status === 429) return TOO_MANY_REQUESTS;

  // `Object.hasOwn`, e não `code in MESSAGES`: o `in` enxerga o protótipo, e um código
  // "toString" devolveria uma função no lugar da frase.
  if (error.code && Object.hasOwn(MESSAGES, error.code)) {
    return MESSAGES[error.code as AuthErrorCode] ?? FALLBACK;
  }
  return FALLBACK;
}
