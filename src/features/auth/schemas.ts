import { z } from "zod";
import {
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/config/auth";

// Roda no navegador (feedback em pt-BR) e no servidor (`hooks.before`). Não importa
// `src/server/`: levaria o servidor para o bundle do navegador.

// `trim` + minúsculas antes de validar. A garantia é da biblioteca, que grava em
// minúsculas; o `trim` é só nosso (ela recusaria " ana@x.com ").
const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Digite seu e-mail.")
  .pipe(z.email("Digite um e-mail válido."));

// `trim` antes do `min(1)`, senão "   " passa. Sem caracteres de controle: `\r\n` no nome
// viraria injeção de cabeçalho num e-mail ou linha de log falsa.
const name = z
  .string()
  .trim()
  .min(1, "Digite seu nome.")
  .max(NAME_MAX_LENGTH, `Use no máximo ${NAME_MAX_LENGTH} caracteres.`)
  .regex(/^[^\p{Cc}]*$/u, "Use apenas letras, espaços e pontuação comum.");

// Sem `trim`: espaço é caractere válido de senha.
const newPassword = z
  .string()
  .min(1, "Crie uma senha.")
  .min(PASSWORD_MIN_LENGTH, `Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`)
  .max(PASSWORD_MAX_LENGTH, `Use no máximo ${PASSWORD_MAX_LENGTH} caracteres.`);

// Login sem o mínimo do cadastro: se o mínimo subir, quem cadastrou antes ainda entra.
export const signInSchema = z.object({
  email,
  password: z
    .string()
    .min(1, "Digite sua senha.")
    .max(
      PASSWORD_MAX_LENGTH,
      `Use no máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
    ),
});

// O que o servidor recebe (uma senha só). É o que o `src/server/auth.ts` importa.
export const signUpSchema = z.object({
  name,
  email,
  password: newPassword,
});

// Núcleo + confirmação (só no navegador: protege de erro de digitação, não de atacante).
// O `path` cola o erro no campo da confirmação.
export const signUpFormSchema = signUpSchema
  .extend({
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não são iguais.",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;

// O tipo não impede `confirmPassword` de ir junto se a variável inteira for passada (só
// objeto literal é checado): o envio monta `{ name, email, password }`.
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignUpFormInput = z.infer<typeof signUpFormSchema>;
