import type { ZodError } from "zod";

/*
  Resultado padrão de toda server action. Falha esperada (validação, regra de negócio) é
  valor de retorno; falha inesperada lança e cai no `error.tsx`. Sem `server-only`: o
  Client Component importa o tipo.
*/

// `{ email: ["Digite um e-mail válido."] }`
export type FieldErrors = Record<string, string[]>;

// União discriminada: `data` e `error` só existem depois de checar `ok`.
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export function ok(): ActionResult<void>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

// `error` vai para a tela: nunca detalhe interno (Prisma, SQL, stack). Isso vai para o log.
export function fail(
  error: string,
  fieldErrors?: FieldErrors,
): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

export function failValidation(
  error: ZodError,
  message = "Confira os campos destacados.",
): ActionResult<never> {
  return fail(message, toFieldErrors(error));
}

// Formulários planos: usa o 1º segmento do `path`. Issue sem campo (de um `.refine` no
// objeto) não vira `fieldError`. Também usada pelos formulários do `authClient`.
export function toFieldErrors(error: ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string") continue;

    fieldErrors[field] ??= [];
    fieldErrors[field].push(issue.message);
  }

  return fieldErrors;
}
