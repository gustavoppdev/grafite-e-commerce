# 14 - Casos de borda de `formatPrice`

Status: resolved
Responsável: Gustavo
Blocked by: 13

## O que

Completar os testes de `formatPrice` e decidir o comportamento para entradas inválidas.

Casos a cobrir:
1. Zero
2. Menos de 1 real (ex. 5 centavos)
3. Valor com milhar e com milhões
4. Valor exato sem centavos (ex. 100 reais)
5. **Entradas inválidas:** número negativo, número não inteiro (`10.5`), `NaN`

## Critérios de aceite

- [x] Um teste por caso, com nomes descritivos em inglês (`it("formats zero as ...")`).
- [x] Decisão tomada e implementada para as entradas inválidas (ver Guia), com teste.
- [x] `pnpm test` passa.

## Guia

- **Onde se inspirar:** o teste de exemplo em `src/lib/format.test.ts` (ticket 13). Mesmo `describe`, novos `it`.
- **Primeiro escreva o teste, veja falhar, depois ajuste o código.** Para os casos 1-4 provavelmente não vai precisar mudar nada; para o caso 5, sim.
- **Espaço não separável:** o teste de exemplo já mostra que o `Intl` usa ` ` entre `R$` e o número. Se um teste seu falhar com uma mensagem do tipo `expected 'R$ 0,00' to be 'R$ 0,00'` (textos que parecem iguais), é isso. Pergunta extra: repetir ` ` em todo `expect` fica ilegível. Como você deixaria os valores esperados mais fáceis de ler sem enfraquecer o teste?
- **Menos de 1 real e valores redondos:** confira o que o `Intl` faz com `5` centavos e com `10000` centavos antes de escrever o valor esperado. Não chute a saída: rode e observe.
- **Decisão sobre entradas inválidas:** duas opções razoáveis.
  - Lançar erro (`throw`): quem chamou com valor errado tem um bug, e é melhor descobrir cedo.
  - Retornar algo como `"R$ 0,00"`: a tela nunca quebra, mas o bug fica escondido.

  Qual combina mais com "dinheiro é sempre inteiro em centavos"? Pense também: de onde viria um preço negativo ou fracionado neste sistema? Para testar um `throw`, veja `expect(...).toThrow()` na doc do Vitest.
- **Negativo:** existe algum lugar no domínio (veja o `CONTEXT.md`) onde um valor negativo faria sentido, como desconto ou estorno? Isso ajuda a decidir.

## Comments

Feito por Gustavo; revisão e acabamento por Claude.

**Decisão sobre entradas inválidas: `throw`.** Preço negativo ou fracionado não é dado
válido no sistema — se chegou ao `formatPrice`, alguém converteu reais para centavos errado
ou subtraiu desconto sem limitar no zero. Devolver `"R$ 0,00"` esconderia o bug atrás de um
preço plausível. O comentário na função registra que este `throw` é a última linha de defesa:
a garantia real vem da constraint da coluna e do Zod no admin (Feature 3).

**Guard em duas condições:** `Number.isInteger` já devolve `false` para `NaN` e `Infinity`,
então cobre os três casos inválidos junto com `cents < 0`. Um `Number.isFinite` extra foi
removido por nunca alterar o resultado.

**Espaço não separável:** resolvido tornando o caractere visível no valor esperado
(`const nbsp = "\u{a0}"`), não afrouxando a comparação. Um helper que normalizava a string
antes do `toBe` foi descartado: ele fazia o teste aceitar o espaço comum, que é justamente
o erro que ele existe para pegar. Mesma razão para não usar `toContain` nem regex com `\s`.

**`toThrow`:** recebe uma função, não o resultado da chamada. Os testes passam um trecho
distintivo da mensagem em vez da frase inteira — `toThrow` com string faz comparação por
conteúdo, e congelar a frase quebraria três testes a cada ajuste de texto. A mensagem NÃO é
importada do `format.ts`: isso faria o teste comparar o módulo consigo mesmo.

**Suíte verificada por sabotagem** (trocar o nbsp por espaço comum: 5 falham; dividir por 10
em vez de 100: 4 falham; aceitar negativo: 1 falha). Verde aqui significa alguma coisa.

Ajustes da revisão: o primeiro teste ainda usava o caractere literal em vez da constante;
a mensagem de erro dizia "non-negative number" mas a função também rejeita não-inteiros;
comentários de andaime do guia viraram o registro do porquê da decisão.
