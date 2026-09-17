# 09 - Página `/cadastro`

Status: open
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

- [ ] Cadastro válido cria o Cliente e mostra a confirmação — **sem** entrar e **sem**
      redirecionar para `/conta`.
- [ ] O Cliente criado tem `role: "user"` no banco (conferir).
- [ ] O formulário **não** envia `confirmPassword` nem qualquer campo de papel para a API.
- [ ] **E-mail já usado mostra exatamente a mesma tela** e não cria nada. Nenhuma diferença
      visual, textual ou de tempo entre os dois casos — é aqui que a proteção contra
      enumeração vive ou morre, e é o critério mais fácil de quebrar sem querer numa
      mudança futura de texto.
- [ ] O CTA leva para `/entrar` e o login funciona em seguida (sem verificação de e-mail
      nesta feature).
- [ ] Senha curta é barrada no cliente com mensagem em pt-BR; senha curta enviada por fora
      do formulário é barrada pelo servidor.
- [ ] `autoComplete="name" | "email" | "new-password"`.
- [ ] Responsivo, teclado, foco visível.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam.

## Notas

- **Nada na tela promete "enviamos um e-mail de confirmação"**, porque nada é enviado até a
  Feature 2. Trocar essa frase é o marco de que a Feature 2 ligou a verificação de e-mail.
- O texto da confirmação é o ponto delicado: ele aparece tanto para quem criou conta quanto
  para quem tentou um e-mail que já existe. Tem que ser verdadeiro nos dois casos sem
  revelar em qual deles a pessoa está — "Conta criada" é falso no segundo. Pensar numa frase
  que sirva aos dois (na linha de "tudo pronto, entre com seu e-mail e senha") e registrar
  a escolha.

## Comments
