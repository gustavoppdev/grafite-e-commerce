// Limites usados pelo servidor e pelo formulário: uma constante para os dois não divergirem.
// Em `config/` porque o navegador importa.

// Sem regra de composição (empurra para `Senha@123`). O máximo protege a CPU: o hash é caro
// de propósito.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

// O better-auth não valida o nome, e ele aparece no header e em e-mail.
export const NAME_MAX_LENGTH = 100;
