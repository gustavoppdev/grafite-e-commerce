# 07 - Mensagens de erro do better-auth em pt-BR

Status: open
Responsável: ~~Gustavo~~ Claude
Blocked by: 03

## O que

O better-auth devolve erro com código e mensagem em inglês. Uma função pura traduz isso para
a frase que o usuário lê — e é aqui que a regra anti-enumeração é aplicada de verdade.

- `src/features/auth/errors.ts` — mapeia o erro do better-auth para uma mensagem em pt-BR
- `src/features/auth/errors.test.ts`

Usada pelos formulários dos tickets 08 e 09.

**Este ticket encolheu depois de os fatos serem verificados** (ver "Anti-enumeração" na
spec): o `/sign-in/email` do better-auth já devolve **um código único**,
`INVALID_EMAIL_OR_PASSWORD`, para usuário inexistente, conta sem senha e senha errada — e
já mitiga o ataque de timing. Não existe par de códigos para colapsar. A proteção é da
biblioteca; o seu trabalho aqui é **confirmar que ela existe** e traduzir.

## Critérios de aceite

- [ ] Você **verificou na prática** (não na doc) que o login devolve o mesmo código e o
      mesmo status para e-mail inexistente e para senha errada, e registrou como verificou.
- [ ] Os códigos usados no mapa vieram de `auth.$ERROR_CODES` / `authClient.$ERROR_CODES`
      ou do código da versão instalada — **não** de string escrita à mão.
- [ ] **Não** existe mensagem de "e-mail já em uso": com `autoSignIn: false` o servidor
      responde sucesso genérico para e-mail duplicado (ver "Fluxo do cadastro" na spec).
      Sentir falta dela é sinal de que você entendeu a proteção — e de que ela funciona.
- [ ] Usuário banido devolve mensagem própria, sem explicar o motivo do ban.
- [ ] Código desconhecido devolve uma mensagem genérica, nunca a string em inglês da
      biblioteca nem `undefined`.
- [ ] Erro de rate limit (429) devolve mensagem pedindo para tentar mais tarde.
- [ ] `pnpm test` passa.

## Guia

### O ataque, e por que ele não é seu para resolver aqui

**Enumeração de contas.** Se "e-mail não cadastrado" e "senha incorreta" fossem respostas
diferentes, o formulário de login viraria uma API de consulta: dá para descobrir quem tem
conta na loja testando uma lista de e-mails, sem acertar senha nenhuma. O resultado é uma
lista de alvos — para phishing dirigido ("sua compra na GRAFITE está com problema") e para
força bruta focada, já sabendo que o e-mail existe.

O detalhe cruel: quem escreve mensagem distinta está tentando **ajudar** o usuário. É desse
trade-off que vem a única coisa que o usuário perde: quem digitou o e-mail errado não
descobre que digitou o e-mail errado. A Feature 2, com recuperação de senha, devolve essa
ajuda de um jeito seguro.

**No login, o better-auth já fechou isso** — e é por isso que o ticket mudou. Vale entender
as duas metades da proteção deles, porque a segunda é a que quase todo mundo esquece:

1. **Resposta idêntica**: um código para os três casos de falha.
2. **Tempo idêntico**: quando não existe senha para conferir, eles fazem hash de uma senha
   falsa de propósito. Sem isso, "usuário não existe" responderia em 2ms e "senha errada" em
   80ms (o custo do scrypt), e o atacante enumeraria **pelo cronômetro**, com as duas
   respostas sendo byte a byte iguais.

Sua primeira tarefa é **duvidar disso e conferir**. É a lição que mais vale no ticket: eu
afirmei o contrário na primeira versão desta spec, com confiança, e estava errado. Meça os
dois casos (código, status e tempo) antes de escrever qualquer mapa.

E no cadastro a proteção passou a existir por decisão nossa: `autoSignIn: false` faz o
servidor responder sucesso genérico para e-mail duplicado. Consequência direta para este
ticket: **não há erro de "e-mail já em uso" para traduzir**. Se um dia alguém adicionar essa
mensagem "para ajudar o usuário", desliga a proteção sem tocar em config nenhuma — vale um
comentário no arquivo avisando disso.

### Como abordar

- **Onde se inspirar:** `src/lib/format.ts` (função pura + guard + comentário do porquê) e o
  bloco de comentário do `fail()` em `src/lib/action-result.ts`, que já diz a regra do
  projeto: mensagem de erro nunca carrega detalhe interno.

- **Descubra os códigos de verdade, não de memória, e não na doc.** Fato apurado: **não
  existe página de documentação listando os códigos de erro de login e cadastro** (as
  páginas de "errors" cobrem só callback de OAuth). A fonte é `auth.$ERROR_CODES` /
  `authClient.$ERROR_CODES` e o código em `node_modules/better-auth`. Escreva no comentário
  de onde você tirou a lista — isso também documenta o risco: lista que veio do código-fonte
  pode mudar numa atualização, e é por isso que o caso "código desconhecido" importa.
  Os que importam aqui: credencial inválida, e-mail já existente, usuário banido, senha
  curta/longa, e o 429 do rate limit.

- **Assinatura:** pense no que a função recebe. O erro do `authClient` tem `code`, `message`
  e `status`. Receber o objeto inteiro é cômodo, mas o que você realmente usa? Uma função
  que recebe só o que usa é mais fácil de testar — e o teste é que vai te dizer se a
  assinatura está boa. Se ficar difícil de montar o input no teste, a assinatura está errada.

- **O padrão para código desconhecido importa mais do que parece.** A biblioteca pode
  ganhar códigos novos numa atualização. Se o seu `switch` cair em `undefined`, a tela mostra
  "undefined" ou fica muda. E se ele cair na `message` da biblioteca, vaza inglês e
  possivelmente detalhe interno para o usuário. Qual é o comportamento certo, e como o
  TypeScript pode te ajudar a não esquecer um caso novo? (Procure "exhaustive switch" e
  `never`, mas pense se dá para usar aqui, já que a lista de códigos vem de fora.)

- **Mensagem de ban:** "Sua conta foi bloqueada." e nada além disso. O `banReason` é uma
  anotação interna do Admin — pode conter qualquer coisa que ele escreveu, inclusive nome de
  outro cliente ou suspeita não confirmada. Nunca vai para a tela.

- **Sobre os testes:** o mapa é entrada e saída pura, teste direto. O caso que merece
  cuidado é o **código desconhecido**, porque é o único que vai acontecer de verdade um dia
  (numa atualização da biblioteca). Teste-o com um código inventado.

- **Um teste que vale a pena mesmo assim:** afirmar que o código do login (`INVALID_EMAIL_OR_PASSWORD`)
  mapeia para uma frase que **não menciona e-mail nem senha separadamente** — ou seja, que
  ninguém "melhorou" a mensagem depois para "e-mail não encontrado". A proteção é da
  biblioteca, mas a frase é nossa, e é nossa a chance de estragá-la.

- **Pitfall:** não importe a frase esperada do `errors.ts` nos testes. Isso faz o teste
  comparar o módulo com ele mesmo e passar sempre (foi a lição do ticket 14 da Fundação).

## Comments
