import type { ADMIN_ERROR_CODES } from "better-auth/client/plugins";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/config/auth";
import type { authClient } from "./auth-client";

// Erro do better-auth → frase em pt-BR. Nunca mostra a `message` da biblioteca.

// Devolvido pelo hook de cadastro em `src/server/auth.ts`, que importa daqui.
export const INVALID_SIGN_UP_FIELDS = "INVALID_SIGN_UP_FIELDS";

// Chaves tipadas pela versão instalada: um código errado quebra o `typecheck`. São só
// tipos (`$ERROR_CODES` em runtime é um proxy, não a lista).
type AuthErrorCode =
  | keyof typeof authClient.$ERROR_CODES
  | keyof typeof ADMIN_ERROR_CODES
  | typeof INVALID_SIGN_UP_FIELDS;

// Anti-enumeração: não existe "e-mail já cadastrado" nem "e-mail não encontrado"
// (`USER_ALREADY_EXISTS` cai na genérica de propósito). Bloqueio sem o motivo; e só aparece
// depois de a senha bater.
const MESSAGES: Partial<Record<AuthErrorCode, string>> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha incorretos.",
  BANNED_USER: "Sua conta está bloqueada.",
  INVALID_EMAIL: "Digite um e-mail válido.",
  PASSWORD_TOO_SHORT: `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`,
  PASSWORD_TOO_LONG: `A senha pode ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
  INVALID_SIGN_UP_FIELDS: "Confira os dados do cadastro.",
};

// O 429 do rate limit vem sem `code`: decide pelo status.
const TOO_MANY_REQUESTS =
  "Muitas tentativas seguidas. Aguarde um pouco e tente de novo.";

const FALLBACK = "Não foi possível concluir agora. Tente de novo em instantes.";

export function authErrorMessage(error: {
  code?: string;
  status: number;
}): string {
  if (error.status === 429) return TOO_MANY_REQUESTS;

  // `hasOwn`: com `in`, o código "toString" acharia a função do protótipo.
  if (error.code && Object.hasOwn(MESSAGES, error.code)) {
    return MESSAGES[error.code as AuthErrorCode] ?? FALLBACK;
  }
  return FALLBACK;
}
