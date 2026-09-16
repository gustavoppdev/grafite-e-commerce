"use server";

import {
  type ActionResult,
  fail,
  failValidation,
  ok,
} from "@/lib/action-result";
import { subscribeSchema } from "./schemas";

/*
  Action de DEMONSTRAÇÃO da Fundação: serve de exemplo vivo do padrão que todas as
  actions do projeto seguem. Não grava nada — na Feature 4 a newsletter de verdade
  entra no lugar dela.

  `"use server"` no topo transforma cada função exportada deste arquivo em um endpoint
  HTTP público. Não é "código que só roda no servidor e ninguém alcança": qualquer pessoa
  consegue montar o POST na mão, sem passar pelo nosso formulário. Por isso a action
  valida a entrada de novo, mesmo quando o formulário já validou no navegador — a
  validação do cliente existe para dar feedback rápido, não para proteger nada.

  Regra geral do projeto: arquivo com `"use server"` exporta APENAS actions. Se exportar
  uma constante ou um helper, o Next reclama; e uma função exportada por engano vira
  endpoint sem ninguém perceber.
*/

// Faz o papel do banco nesta demo: e-mails que "já existem".
const ALREADY_SUBSCRIBED = ["ana@grafite.test"];

export async function subscribeToNewsletter(
  // O `useActionState` passa o resultado anterior como primeiro argumento. Não usamos
  // aqui, mas a assinatura precisa recebê-lo para o FormData chegar no segundo.
  _previous: ActionResult<{ email: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ email: string }>> {
  /*
    `formData.get()` devolve `string | File | null` — nunca confie no tipo. O `safeParse`
    é quem transforma esse valor de origem desconhecida em dado tipado. Usamos `safeParse`
    (e não `parse`) porque entrada inválida aqui é um caso esperado, não uma exceção.
  */
  const parsed = subscribeSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return failValidation(parsed.error);
  }

  const { email } = parsed.data;

  // Regra de negócio que só o servidor consegue checar: o navegador não sabe quem já
  // se inscreveu. Erro sem `fieldErrors` — é sobre o pedido inteiro, não sobre o formato
  // do campo.
  if (ALREADY_SUBSCRIBED.includes(email.toLowerCase())) {
    return fail("Este e-mail já está inscrito na nossa lista.");
  }

  /*
    O `data` devolvido é serializado e enviado ao navegador, então só vai para dentro
    dele o que a tela precisa mostrar. Nunca o registro cru do banco: um `User` do Prisma
    carrega hash de senha, e-mail de outras pessoas, papel de admin — tudo isso viajaria
    junto sem aparecer na interface.
  */
  return ok({ email });
}
