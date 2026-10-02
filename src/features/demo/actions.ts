"use server";

import {
  type ActionResult,
  fail,
  failValidation,
  ok,
} from "@/lib/action-result";
import { subscribeSchema } from "./schemas";

// Action de demonstração do padrão `ActionResult` (não grava nada). `"use server"` torna
// cada export um endpoint público: valida de novo no servidor, e o arquivo só exporta actions.

const ALREADY_SUBSCRIBED = ["ana@grafite.test"];

export async function subscribeToNewsletter(
  // O `useActionState` passa o estado anterior primeiro; o FormData vem em segundo.
  _previous: ActionResult<{ email: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ email: string }>> {
  // `formData.get()` é `string | File | null`: o `safeParse` transforma em dado tipado.
  const parsed = subscribeSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return failValidation(parsed.error);
  }

  const { email } = parsed.data;

  // Regra que só o servidor sabe checar; erro do pedido, não de um campo.
  if (ALREADY_SUBSCRIBED.includes(email.toLowerCase())) {
    return fail("Este e-mail já está inscrito na nossa lista.");
  }

  // `data` vai para o navegador: só o que a tela mostra, nunca o registro do banco.
  return ok({ email });
}
