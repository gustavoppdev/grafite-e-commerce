import { z } from "zod";

/*
  O schema mora em um arquivo separado de propósito: a mesma regra vale no servidor
  (dentro da action) e mais tarde no cliente (react-hook-form, a partir da Feature 3).
  Uma regra só, um lugar só — não existe "validação do formulário" diferente da
  "validação da action".

  As mensagens ficam aqui, em pt-BR, porque são elas que o usuário lê no campo.
*/
export const subscribeSchema = z.object({
  // `trim()` antes de validar: " ana@grafite.test " é o mesmo e-mail, só com dedo gordo.
  email: z
    .string()
    .trim()
    .min(1, "Digite seu e-mail.")
    .pipe(z.email("Digite um e-mail válido.")),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;
