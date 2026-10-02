import { z } from "zod";

// Arquivo próprio: a mesma regra vale na action e no cliente.
export const subscribeSchema = z.object({
  // `trim()` antes de validar: " ana@grafite.test " é o mesmo e-mail, só com dedo gordo.
  email: z
    .string()
    .trim()
    .min(1, "Digite seu e-mail.")
    .pipe(z.email("Digite um e-mail válido.")),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;
