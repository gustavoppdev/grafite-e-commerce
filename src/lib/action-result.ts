import type { ZodError } from "zod";

/*
  Resultado padrão de TODA server action do projeto.

  Por que devolver um resultado em vez de lançar erro?
  Uma server action é uma requisição HTTP disfarçada de chamada de função. Se ela lança,
  o Next mostra o `error.tsx` e a tela inteira vira uma página de erro — comportamento
  certo para "o banco caiu", errado para "esse e-mail já está cadastrado". Falha ESPERADA
  (validação, regra de negócio, permissão) é um valor de retorno; falha INESPERADA
  (bug, banco fora do ar) continua lançando e cai no boundary de erro.

  Em produção o Next também troca a mensagem de um erro lançado por um texto genérico
  com um ID, justamente para não vazar detalhe interno ao navegador. Ou seja: lançar
  não é um jeito de "mandar mensagem" para o cliente.

  Este arquivo NÃO tem `server-only`: o Client Component que consome a action precisa
  importar o tipo para ler `result.ok`. Só tipos e funções puras moram aqui, nada sensível.
*/

// Erros por campo do formulário: `{ email: ["Digite um e-mail válido."] }`.
export type FieldErrors = Record<string, string[]>;

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

/*
  União discriminada: `ok` é o campo que diz em qual dos dois lados estamos.
  O TypeScript só libera `result.data` depois de um `if (result.ok)`, e só libera
  `result.error` no `else`. Não dá para esquecer de tratar o erro — o compilador
  reclama antes de o código rodar.
*/

export function ok(): ActionResult<void>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

/*
  A mensagem de `error` vai direto para a tela do usuário, então ela nunca carrega
  detalhe interno: nada de mensagem de exceção do Prisma, SQL, caminho de arquivo,
  stack trace ou nome de coluna. Esses detalhes viram pista para quem está atacando
  (que tabelas existem, qual ORM, qual versão) e não ajudam em nada quem só quer comprar.
  Detalhe técnico vai para o `console.error` do servidor; para o cliente vai uma frase em pt-BR.
*/
export function fail(
  error: string,
  fieldErrors?: FieldErrors,
): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/*
  Converte o erro do Zod no formato que o formulário consome.

  Cada issue do Zod tem um `path` (o caminho até o campo) e uma `message`. Pegamos só o
  primeiro segmento do path porque nossos formulários são planos (`email`, `name`);
  quando aparecer campo aninhado ou array, este helper é o lugar de tratar isso.

  Issues sem path são do objeto inteiro (ex. um `.refine()` que compara dois campos) e
  não pertencem a nenhum campo — viram a mensagem geral, não um `fieldError`.
*/
export function failValidation(
  error: ZodError,
  message = "Confira os campos destacados.",
): ActionResult<never> {
  return fail(message, toFieldErrors(error));
}

/*
  A conversão sozinha, para formulário que valida no navegador e não passa por action
  (login e cadastro, que falam com o `authClient`). Mesmo formato, mesma tela de erro.
*/
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
