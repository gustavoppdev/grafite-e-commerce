/*
  Contra open redirect: `?next=` é entrada de usuário, e o redirect pós-login não pode levar
  para fora do site (nem executar `javascript:` no `router.replace`). Lista de permissão:
  só passa o que tem a forma de um caminho interno; o resto cai no `fallback`.
*/

/*
  Uma barra; o 2º caractere não é `/` nem `\` (`//x` e `/\x` são outro domínio); depois, só
  caracteres de caminho ASCII. Ficam de fora `@` (usuário@host), `\`, `:` (esquema), espaço,
  tab e quebra de linha (o navegador apaga os dois últimos depois da checagem).
*/
const INTERNAL_PATH = /^\/(?![/\\])[A-Za-z0-9\-._~/?#=&%+,]*$/;

// O `searchParams` já decodificou uma vez: `%2f`, `%5c` ou `%25` aqui é codificação dupla.
// Recusa em vez de decodificar, para validar a mesma string que será usada.
const ENCODED_SEPARATOR = /%(2f|5c|25)/i;

// Domínio reservado (RFC 2606), só como base do `new URL`.
const PROBE_ORIGIN = "https://safe-redirect.invalid";

// `unknown` de propósito: `searchParams` pode trazer array ou `undefined`.
export function safeRedirectPath(value: unknown, fallback = "/conta"): string {
  if (typeof value !== "string") return fallback;
  if (!INTERNAL_PATH.test(value)) return fallback;
  if (ENCODED_SEPARATOR.test(value)) return fallback;

  // Segunda opinião do parser de URL, para o dia em que a regex for afrouxada.
  if (new URL(value, PROBE_ORIGIN).origin !== PROBE_ORIGIN) return fallback;

  // Caminho interno restrito (`/admin` para Cliente) passa: quem barra é a página.
  return value;
}
