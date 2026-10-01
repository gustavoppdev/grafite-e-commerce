import { z } from "zod";
import {
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/config/auth";

/*
  Primeiro schema do projeto que roda nos DOIS lados:
  - no navegador, nos formulários de `/entrar` e `/cadastro` (tickets 08 e 09), para dar a
    mensagem em pt-BR no campo antes de gastar uma requisição;
  - no servidor, no `hooks.before` do `src/server/auth.ts`, para impor a regra a quem manda
    o POST na mão, sem passar pelo formulário.

  Por isso o arquivo não importa nada de `src/server/`: o `server/` pode importar daqui, o
  contrário nunca. Se este arquivo puxasse o servidor, o formulário levaria o servidor junto
  para o bundle do navegador (e o `server-only` quebraria o build, que é para isso que ele
  existe).
*/

/*
  E-mail: `trim` + minúsculas ANTES de validar. " Ana@Grafite.test " e "ana@grafite.test"
  são a mesma pessoa.

  O better-auth já grava e busca o e-mail em minúsculas no servidor (conferido em
  `sign-up.mjs` e `sign-in.mjs`), e é isso que garante a regra para qualquer caminho de
  cadastro, inclusive um `curl`. Fazer o mesmo aqui não é a garantia, é para o valor que a
  pessoa vê, o que validamos e o que o servidor grava serem o mesmo.

  O `trim` é nosso: a biblioteca NÃO faz, e recusaria " ana@x.com " como inválido.
*/
const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Digite seu e-mail.")
  .pipe(z.email("Digite um e-mail válido."));

/*
  Nome: `trim` antes do `min(1)`. Sem ele, "   " passaria no `min(1)` (são 3 caracteres) e
  viraria um nome em branco no header.

  Caracteres de controle (quebra de linha, tab, NUL...) são recusados. Nenhum nome real tem
  esses caracteres, e eles são o material de dois ataques: injeção de cabeçalho quando o
  nome entra no assunto de um e-mail (Feature 2) — um "\r\nBcc: ..." no meio do nome — e
  falsificação de linha de log, quando o nome é registrado.
*/
const name = z
  .string()
  .trim()
  .min(1, "Digite seu nome.")
  .max(NAME_MAX_LENGTH, `Use no máximo ${NAME_MAX_LENGTH} caracteres.`)
  .regex(/^[^\p{Cc}]*$/u, "Use apenas letras, espaços e pontuação comum.");

/*
  Senha: SEM `trim`. Espaço é um caractere válido de senha, e cortá-lo mudaria a senha que
  a pessoa escolheu sem ela saber.
*/
const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`)
  .max(PASSWORD_MAX_LENGTH, `Use no máximo ${PASSWORD_MAX_LENGTH} caracteres.`);

/*
  Login: só "não vazia" e o máximo. NUNCA a regra de mínimo do cadastro: se um dia o mínimo
  subir, quem cadastrou antes com a senha antiga precisa continuar conseguindo entrar. O
  objetivo aqui é só não gastar uma requisição (e uma tentativa do rate limit) num formulário
  obviamente incompleto. O máximo existe porque o servidor também o impõe no login.
*/
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

/*
  Cadastro, o NÚCLEO: só os campos que o servidor recebe de verdade. É este que o
  `src/server/auth.ts` importa. O servidor recebe UMA senha, então `confirmPassword` não
  existe aqui — se existisse, o servidor teria que validar um campo que nunca chega.
*/
export const signUpSchema = z.object({
  name,
  email,
  password: newPassword,
});

/*
  Cadastro, o FORMULÁRIO: o núcleo + a confirmação de senha. Só o navegador usa. Confirmar
  a senha protege contra erro de digitação, não contra atacante, então não perder isso no
  servidor não é perda.

  A comparação mora no `.refine` do OBJETO, não num campo: um campo não enxerga o outro, e
  os dois valores só existem juntos depois que o objeto inteiro foi lido (mesma forma da
  regra de https em `src/config/env.schema.ts`). Sem `path`, a issue seria do objeto e
  apareceria como erro geral no topo do formulário; o `path` a cola no campo
  `confirmPassword`, onde a pessoa está olhando.
*/
export const signUpFormSchema = signUpSchema
  .extend({
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não são iguais.",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;

/*
  O formulário (ticket 09) valida com `signUpFormSchema`, mas o que manda para a API é
  `SignUpInput`, sem `confirmPassword`.

  Cuidado: o tipo sozinho NÃO impede a confirmação de viajar de carona. O TypeScript só
  reclama de campo a mais em objeto literal; passar a variável `data` inteira onde se espera
  `SignUpInput` compila sem erro, e o campo vai junto na requisição. Por isso o envio monta
  o objeto campo a campo (`{ name, email, password }`), sem repassar `data`.
*/
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignUpFormInput = z.infer<typeof signUpFormSchema>;
