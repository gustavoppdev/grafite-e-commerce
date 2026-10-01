# 09 - Página `/cadastro`

Status: resolved
Responsável: Claude
Blocked by: 08

## O que

- `src/app/(store)/cadastro/page.tsx` — mesma estrutura do ticket 08.
- `src/features/auth/components/sign-up-form.tsx` — `signUpFormSchema` (nome, e-mail, senha,
  confirmação), `authClient.signUp.email`, erros pelo `authError`, link para `/entrar`.
- **Estado de sucesso** (`autoSignIn: false`, ver "Fluxo do cadastro" na spec): a pessoa
  **não** entra automaticamente. A tela troca para uma confirmação, com CTA para `/entrar`.
  Em estado no lugar do formulário, não em rota nova — rota de sucesso sobrevive a refresh
  mas fica acessível fora de contexto; a Feature 2 pode querer rota quando houver e-mail
  para conferir.
- Reaproveitar a casca criada no ticket 08.

## Critérios de aceite

- [x] Cadastro válido cria o Cliente e mostra a confirmação — **sem** entrar e **sem**
      redirecionar para `/conta`.
- [x] O Cliente criado tem `role: "user"` no banco (conferir).
- [x] O formulário **não** envia `confirmPassword` nem qualquer campo de papel para a API.
- [x] **E-mail já usado mostra exatamente a mesma tela** e não cria nada. Nenhuma diferença
      visual, textual ou de tempo entre os dois casos — é aqui que a proteção contra
      enumeração vive ou morre, e é o critério mais fácil de quebrar sem querer numa
      mudança futura de texto.
- [x] O CTA leva para `/entrar` e o login funciona em seguida (sem verificação de e-mail
      nesta feature).
- [x] Senha curta é barrada no cliente com mensagem em pt-BR; senha curta enviada por fora
      do formulário é barrada pelo servidor.
- [x] `autoComplete="name" | "email" | "new-password"`.
- [x] Responsivo, teclado, foco visível.
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam.

## Notas

- **Nada na tela promete "enviamos um e-mail de confirmação"**, porque nada é enviado até a
  Feature 2. Trocar essa frase é o marco de que a Feature 2 ligou a verificação de e-mail.
- O texto da confirmação é o ponto delicado: ele aparece tanto para quem criou conta quanto
  para quem tentou um e-mail que já existe. Tem que ser verdadeiro nos dois casos sem
  revelar em qual deles a pessoa está — "Conta criada" é falso no segundo. Pensar numa frase
  que sirva aos dois (na linha de "tudo pronto, entre com seu e-mail e senha") e registrar
  a escolha.

## Comments

### 2026-10-01 — Claude: feito

Arquivos: `src/app/(store)/cadastro/page.tsx`, `src/features/auth/components/sign-up-form.tsx`.
Extraídos do login para os dois formulários usarem: `src/features/auth/auth-request.ts`
(timeout de 15s + `try/catch` + tradução do erro) e `components/focus-field.ts`. A
`AuthCard` ganhou `footer` opcional e `titleRef`.

Antes do ticket, dois ajustes de layout pedidos na revisão do 08 (commit `454bc1b`): a
`AuthCard` alinha pelo topo em vez de centralizar na vertical (a mensagem de erro só empurra
o que está abaixo; título e primeiro campo não se mexem, medido) e `scrollbar-gutter: stable`
no `html` (a barra de rolagem aparece sem deslocar a página para o lado).

**Decisões:**

- **O formulário renderiza a própria `AuthCard`**, porque título, texto e rodapé trocam na
  confirmação. A confirmação é estado, não rota.
- **Texto da confirmação**, o mesmo para e-mail novo e repetido: título "Tudo pronto",
  "Agora é só entrar com seu e-mail e senha." e, para todo mundo, "Se você já tinha uma
  conta com este e-mail, entre com a senha que já usava." É verdadeiro nos dois casos,
  ajuda o caso comum (o dono que esqueceu que tinha conta) e não revela qual dos dois
  aconteceu, porque aparece sempre. Nada promete e-mail enviado.
- **Foco no título "Tudo pronto"** depois do envio (`titleRef` + `tabIndex={-1}`): o
  botão clicado deixa de existir, e sem isso o foco cairia no `<body>`.
- **Envio campo a campo** (`{ name, email, password }`), nunca o `parsed.data` inteiro, que
  carrega `confirmPassword`.
- **`?next=` segue até o login** pelo CTA e pelo link "Entrar" do rodapé.
- **Senha vazia ganhou "Crie uma senha."** (antes: "Use pelo menos 8 caracteres." num campo
  em branco). Teste novo em `schemas.test.ts`.
- **Bug da Fundação achado aqui** (commit `71ffbab`): `buttonVariants()` só concatenava as
  classes e `border-transparent` vencia `border-foreground`, então todo `<Link>` com cara de
  botão saía sem borda (o CTA desta tela e o "Voltar para a loja" da 404). Agora
  `buttonVariants` passa pelo `cn`.

**Verificação** (Chrome headless + `curl` + consulta ao banco; usuários de teste apagados):

| Caso | Resultado |
|---|---|
| Enviar vazio | 4 mensagens nos campos, foco no nome |
| Nome só espaços, senha curta, confirmação diferente | "Digite seu nome." / "Use pelo menos 8 caracteres." / "As senhas não são iguais." |
| Corpo enviado à API (requisição interceptada) | `{"name":"Teste Nove","email":"dev-09@example.test","password":"..."}`: sem `confirmPassword`, sem `role`, nome já sem espaços |
| Cadastro novo | tela "Tudo pronto", foco no título, CTA `/entrar?next=%2Fdesign-system` |
| Mesmo e-mail, em maiúsculas, outra senha e outro nome | **HTML do `<main>` idêntico** ao do cadastro novo |
| Tempo no servidor (`curl`, 6 pares) | novo 811–817ms, repetido 810–813ms |
| Banco | 1 usuário, `role: "user"`, 1 conta, nome `Teste Nove`; a tentativa repetida não criou nem alterou nada |
| CTA → login com a senha original | entra e vai para `/design-system` |
| Senha de 7 caracteres por `curl` | 400 `invalid sign-up fields: password` (servidor) |
| Logado abrindo `/cadastro` | → `/conta` |
| Tab a partir do nome | e-mail → senha → confirmação → "Criar conta" → "Entrar" |
| 400px | sem rolagem horizontal |

No navegador, o cadastro novo levou 1,8s e o repetido 1,3s. Não é vazamento: medido direto
no servidor, os dois empatam (tabela acima). A diferença é do navegador na primeira
requisição da página, e quem tenta enumerar só enxerga o tempo do servidor.
