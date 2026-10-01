/*
  Limites de cadastro, num lugar só. Quem importa: o `src/server/auth.ts` (o que o
  better-auth impõe) e o `src/features/auth/schemas.ts` (o que o formulário avisa em pt-BR).

  Se os dois lados tivessem números próprios, um dia divergiriam: o formulário diria "ok"
  para uma senha que o servidor recusa, e a pessoa leria um erro em inglês da biblioteca.
  Uma constante compartilhada torna a divergência impossível, em vez de só detectável.

  Mora em `config/` e NÃO em `server/`: o formulário roda no navegador e precisa importar
  estes números, e nada em `server/` pode chegar ao navegador. São números públicos —
  qualquer um descobre o mínimo de senha tentando cadastrar.
*/

/*
  Senha: mínimo 8, sem regra de composição (maiúscula, símbolo...). Composição empurra todo
  mundo para `Senha@123`; o que protege é comprimento + checagem de senha vazada (Feature 2).

  O máximo é sobre CPU, não sobre a pessoa: o hash de senha (scrypt) é lento de propósito,
  e aceitar uma senha de 1 MB é deixar qualquer um ocupar o servidor com poucas requisições.
  128 cabe com folga qualquer frase-senha ou senha de gerenciador.
*/
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/*
  Nome: o better-auth não valida nada (ticket 03), e o nome aparece no header da loja e, na
  Feature 2, no assunto de e-mail. 100 cabe qualquer nome completo real com sobra e impede
  que alguém guarde um texto de 5 mil caracteres que quebra o layout de todo mundo que o vê
  (o Admin, na lista de usuários).
*/
export const NAME_MAX_LENGTH = 100;
