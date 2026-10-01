# 06 - Schemas de cadastro e login (Zod) e testes

Status: open
Responsável: ~~Gustavo~~ Claude
Blocked by: -

## O que

Os schemas que os formulários dos tickets 08 e 09 usam, com as mensagens em pt-BR que o
usuário lê no campo, e testes.

- `src/features/auth/schemas.ts` — `signInSchema`, `signUpSchema` e `signUpFormSchema`
- `src/features/auth/schemas.test.ts`

Campos: login = `email`, `password`. Cadastro = `name`, `email`, `password`,
`confirmPassword`.

**São três schemas, não dois, e o motivo é o que decide o desenho do arquivo.** O
`signUpSchema` é o núcleo: só os campos que o servidor recebe de verdade (`name`, `email`,
`password`). O `signUpFormSchema` estende esse núcleo com `confirmPassword` e a comparação
entre os dois campos.

Por que partir: o `signUpSchema` vai ser importado pelo `src/server/auth.ts` e rodar no
servidor, dentro do `hooks.before` (ticket 03) — é a camada 3 da tabela de validação da
spec. O servidor recebe **uma** senha, então `confirmPassword` não existe lá; um schema
único obrigaria o servidor a validar um campo inventado. Já o `signUpFormSchema` só o
formulário usa.

## Critérios de aceite

- [ ] `signInSchema` recusa e-mail vazio, e-mail malformado e senha vazia, com mensagem
      em pt-BR por campo.
- [ ] `signUpSchema` recusa senha com menos de 8 caracteres e mais de 128, nome vazio e
      nome só com espaços.
- [ ] `signUpFormSchema` recusa `confirmPassword` diferente de `password`, e o erro aparece
      **no campo `confirmPassword`**, não como erro geral.
- [ ] O tipo de `signUpSchema` **não** tem `confirmPassword` (é ele que o servidor importa).
- [ ] E-mail é normalizado (espaços e caixa) antes de validar.
- [ ] Teste por caso, nomes descritivos em inglês, `pnpm test` passa.

## Guia

- **Onde se inspirar:** `src/features/demo/schemas.ts`. Ele já mostra o `trim()` antes do
  `.pipe(z.email(...))`, o comentário de por que o schema mora em arquivo separado e o
  `z.infer` exportado no fim. Mesmo formato aqui.

- **Por que o login também valida:** "senha vazia" não é uma regra de segurança, é para não
  gastar uma requisição (e uma tentativa do rate limit) num formulário obviamente
  incompleto. Não invente regra de formato de senha **no login** — se a senha de alguém foi
  cadastrada antes de uma regra nova, ela tem que continuar conseguindo entrar.

- **Caixa do e-mail:** `Ana@Grafite.test` e `ana@grafite.test` são a mesma pessoa. Decida
  onde normalizar e deixe claro no comentário. Pergunta que vale pensar: se você
  transformasse em minúsculas só no formulário e não em todo lugar, o que aconteceria com
  alguém que se cadastrou por outro caminho? (Confira o que o better-auth já faz com o
  e-mail antes de decidir duplicar o trabalho — não chute, olhe.)

- **Confirmação de senha:** este é o exercício do padrão que o **ticket 01** virou exemplo
  trabalhado. Leia `src/config/env.schema.ts` antes de começar: a regra "em produção a URL
  tem que ser https" tem a mesma forma que a sua ("`confirmPassword` tem que ser igual a
  `password`") — duas coisas que só podem ser comparadas depois que o objeto inteiro foi
  parseado. O comentário grande lá embaixo explica por que ela não cabe dentro de um campo,
  e o `path` no `addIssue` é a mesma resposta que você vai precisar aqui.

  Comparar dois campos não é regra de um campo. No Zod isso é
  `.refine()`/`.superRefine()` **no objeto**, depois do `z.object({...})`. Por padrão a
  issue sai **sem `path`** — e aí, olhe o `failValidation` em `src/lib/action-result.ts`:
  issue sem path vira mensagem geral, não erro de campo. Como você faz a mensagem aparecer
  colada no campo `confirmPassword`? (Dica: o segundo argumento do `refine` aceita `path`.)

- **Os limites 8 e 128:** não são números seus, são os do `src/server/auth.ts` (ticket 03).
  Se divergirem, o usuário recebe uma mensagem em inglês da biblioteca em vez da sua em
  pt-BR — a validação do cliente teria dito "ok" para algo que o servidor recusa. Como você
  garante que os dois não se separem com o tempo? Existe mais de uma resposta razoável
  (constante compartilhada em `src/config/`, ou um teste que falha se divergirem). Escolha
  uma e registre o porquê. Cuidado com uma armadilha: a constante pode ser importada pelos
  dois lados? De onde ela **não** pode vir? (Reveja a regra do `src/server/`.)

- **Por que 128 no máximo:** está na spec — hash de senha é caro de propósito. Escreva isso
  no comentário, porque um limite máximo de senha parece hostil ao usuário até você saber
  que é sobre CPU.

- **Sobre os testes:** schema é entrada e saída pura, o teste é direto. Use `safeParse` e
  verifique `success` e, quando falhar, **em qual campo** o erro caiu — um teste que só
  confere `success === false` passaria mesmo se a mensagem aparecesse no campo errado.
  Sabote: troque o `min(8)` por `min(1)` e veja se algum teste reclama.

- **Nome:** é o campo em que o better-auth provavelmente **não** ajuda (o ticket 03 vai
  confirmar). Ele termina no header da loja e, na Feature 2, no assunto de um e-mail. Pense
  em mínimo, máximo e `trim` — e no que acontece com `"   "` se você só usar `min(1)`.

- **Este é o primeiro schema do projeto que roda nos dois lados.** Vale reler a tabela
  "Critério para escolher a pasta" na spec da Fundação: por que o arquivo pode morar em
  `src/features/auth/` e ser importado por `src/server/auth.ts`, mas o contrário nunca vale?

- **Pitfall:** o formulário tem `confirmPassword` em mãos e não pode mandá-lo para a API.
  Se o `signUpFormSchema` for o tipo que você passa adiante, o campo viaja de carona.
  Pense em como o tipo do núcleo te obriga a separar em vez de você lembrar de separar.

## Comments
