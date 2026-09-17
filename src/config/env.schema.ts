import { z } from "zod";

/*
  Só variáveis de SERVIDOR. Nada aqui chega ao navegador.

  Se um dia precisarmos de uma variável no navegador, ela terá prefixo `NEXT_PUBLIC_`
  e ficará num schema separado. Atenção: o Next copia o VALOR de `NEXT_PUBLIC_*` para
  dentro do JavaScript enviado ao usuário no momento do build. Qualquer pessoa consegue
  ler. Por isso, segredo (senha, chave de API, URL do banco) nunca leva esse prefixo.

  Mora em `src/config/` e não em `src/server/` justamente porque NÃO pode ter "server-only":
  o `next.config.ts` (que roda fora do React) e os testes precisam importá-lo. Quem usa o
  `env` dentro do app importa de `@/server/env`, que é onde a proteção fica.
*/

const postgresUrl = z.url({
  protocol: /^postgres(ql)?$/,
  error: (issue) =>
    issue.input === undefined
      ? "obrigatória, mas não foi definida"
      : "deve ser uma URL de conexão postgresql://",
});

/*
  URL base da aplicação. O better-auth monta as rotas de `/api/auth` a partir dela.
  Não é segredo, mas também não leva `NEXT_PUBLIC_`: quem precisa dela é o servidor.

  Os DOIS protocolos passam aqui. Exigir https é regra de produção, e regra de produção
  depende de outro campo (`NODE_ENV`) — ela mora no `.superRefine` do objeto, mais abaixo.
  Aceitar só `http` aqui deixaria a produção impossível de configurar.
*/
const betterAuthUrl = z
  .url({
    protocol: /^https?$/,
    error: (issue) =>
      issue.input === undefined
        ? "obrigatória, mas não foi definida"
        : "deve ser uma URL http:// ou https://",
  })
  /*
    Barra no fim quebra a concatenação: `http://localhost:3000/` + `/api/auth` vira
    `http://localhost:3000//api/auth`. Conferido que o `z.url()` do Zod 4.6 NÃO normaliza
    a string (devolve exatamente o que entrou), então esta checagem faz trabalho de verdade.
  */
  .refine((url) => !url.endsWith("/"), {
    error: "não pode terminar com barra",
  });

/*
  Chave que ASSINA o cookie de sessão. Fraca ou vazada, dá para forjar um cookie válido
  para qualquer usuário — autenticação derrubada sem precisar da senha de ninguém.

  O que esta validação consegue, e o que não:

  Ela é um PISO contra o erro bobo (`secret123`, metade da chave colada), não uma prova de
  força. Nenhuma expressão regular mede entropia — `"AAAA…A="` com 43 letras A tem o formato
  exato de um base64 de 32 bytes e não vale nada. Por isso: só um mínimo, sem regra de
  alfabeto e sem tamanho exato.

  E por que MÍNIMO e não exato: fixar 44 caracteres amarraria o projeto ao formato de um
  gerador só (`openssl rand -base64 32`) e recusaria coisas mais fortes — uma chave de 64
  bytes, ou base64url (usa `-` e `_`, sem `=`), que é o que várias ferramentas emitem.
  Validação que recusa a resposta certa é pior que validação nenhuma: ela ensina quem está
  configurando a contornar o schema.
*/
const betterAuthSecret = z
  .string({
    error: (issue) =>
      issue.input === undefined
        ? "obrigatória, mas não foi definida"
        : "deve ser um texto",
  })
  .min(
    32,
    "deve ter no mínimo 32 caracteres (gere com `openssl rand -base64 32`)",
  );

export const serverEnvSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    // Conexão via pooler (transaction mode) usada pela aplicação em runtime.
    DATABASE_URL: postgresUrl,
    BETTER_AUTH_URL: betterAuthUrl,
    BETTER_AUTH_SECRET: betterAuthSecret,
  })
  /*
    ────────────────────────────────────────────────────────────────────────────────
    Regra que olha DOIS campos ao mesmo tempo: em produção, a URL base tem que ser https.

    O ataque: em `http://`, o cookie de sessão trafega em texto puro. Quem estiver na mesma
    rede (wi-fi de café, roteador comprometido) lê o cookie e vira o usuário — não precisa
    da senha, porque o cookie É a credencial.

    Repare na SEGUNDA condição, a de `localhost`, porque ela não é frescura: `NODE_ENV`
    vale "production" em todo BUILD de produção, inclusive no `pnpm build` e no
    `pnpm typecheck` rodando na sua máquina, com o `.env` local apontando para
    `http://localhost:3000`. Sem a exceção, a regra quebra o build local — foi exatamente
    o que aconteceu ao escrever isto. Ou seja: `NODE_ENV === "production"` significa
    "compilado em modo produção", NÃO "rodando em produção". Não é o sinal que o nome
    promete, e confundir os dois é erro comum.

    POR QUE ESTA REGRA ESTÁ AQUI, e não dentro do campo `BETTER_AUTH_URL`:

    Um schema de campo enxerga só o próprio valor. Para decidir se https é obrigatório é
    preciso saber o `NODE_ENV` — e o `NODE_ENV` VALIDADO, com o `.default("development")` já
    aplicado, só passa a existir depois que o objeto inteiro foi parseado. Por isso a regra
    vive num `.superRefine` DEPOIS do `z.object({...})`: é onde os dois valores chegam
    juntos e prontos. É a mesma forma de problema de comparar `password` com
    `confirmPassword` num formulário.

    A alternativa tentadora — ler `process.env.NODE_ENV` numa constante no topo do arquivo e
    usar numa condição dentro do campo — quebra de três jeitos:

      1. lê uma fonte diferente da que o `parseServerEnv` recebeu por argumento, o que torna
         a função impura e a regra impossível de testar;
      2. é avaliada uma vez só, no import do módulo, em vez de a cada parse;
      3. não enxerga o `.default` acima. Com `NODE_ENV` ausente (o caso do `next typegen`),
         o schema conclui "development" e a condição de fora conclui "production" — duas
         respostas para a mesma pergunta, no mesmo parse.

    Teste que prova que está no lugar certo: dá para chamar `parseServerEnv` com um objeto
    montado à mão e controlar a regra só pelo `NODE_ENV` DESSE objeto, sem encostar no
    `process.env`. Se precisar mexer no ambiente para testar, a regra está no lugar errado.
  */
  .superRefine((env, ctx) => {
    // Endereços que nunca saem da máquina: em http neles não há rede para escutar.
    const localHosts = ["localhost", "127.0.0.1", "[::1]"];
    const { protocol, hostname } = new URL(env.BETTER_AUTH_URL);

    if (
      env.NODE_ENV === "production" &&
      protocol === "http:" &&
      !localHosts.includes(hostname)
    ) {
      ctx.addIssue({
        code: "custom",
        // Sem `path`, a issue é do objeto inteiro e o `parseServerEnv` abaixo imprimiria
        // `  - : mensagem`, sem dizer qual variável arrumar. O `path` gruda no campo.
        path: ["BETTER_AUTH_URL"],
        message:
          "em produção precisa ser https:// (o cookie de sessão viaja nela)",
      });
    }
  });

/*
  A `DIRECT_URL` (conexão direta, usada pelas migrations) NÃO está aqui de propósito.

  Cada consumidor valida o que ele próprio usa: a aplicação usa só o pooler, então só ele
  é obrigatório aqui. Quem precisa da conexão direta é a CLI do Prisma, e é o
  `prisma.config.ts` que a consome.

  Isso não é arrumação, é privilégio mínimo: a conexão direta fura o pooler e aceita
  comandos que ele recusa. Exigi-la aqui obrigaria a colocá-la também na Vercel, dando ao
  runtime uma credencial poderosa que ele nunca usa — e que vazaria junto em qualquer log
  ou erro que despeje o ambiente. Ela fica só na máquina de quem roda migration.
*/

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  source: Record<string, string | undefined>,
): ServerEnv {
  const result = serverEnvSchema.safeParse(source);

  if (!result.success) {
    // Mostra QUAL variável falhou e POR QUÊ, nunca o valor: a URL do banco contém
    // a senha, e logs de build ficam visíveis na Vercel, no CI, em prints de erro...
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Variáveis de ambiente inválidas:\n${problems}\n\nConfira o arquivo .env (modelo em .env.example).`,
    );
  }

  return result.data;
}
