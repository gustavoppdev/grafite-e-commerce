# 14 - Casos de borda de `formatPrice`

Status: open
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

- [ ] Um teste por caso, com nomes descritivos em inglês (`it("formats zero as ...")`).
- [ ] Decisão tomada e implementada para as entradas inválidas (ver Guia), com teste.
- [ ] `pnpm test` passa.

## Guia

- **Onde se inspirar:** o teste de exemplo em `src/lib/format.test.ts` (ticket 13). Mesmo `describe`, novos `it`.
- **Primeiro escreva o teste, veja falhar, depois ajuste o código.** Para os casos 1-4 provavelmente não vai precisar mudar nada; para o caso 5, sim.
- **Armadilha nº 1 (a mais comum):** o `Intl.NumberFormat` coloca um **espaço não separável** (` `) entre `R$` e o número, não um espaço normal. Seu teste com `"R$ 0,00"` vai falhar mesmo parecendo idêntico. Investigue: como você descobriria qual caractere é esse? E como escrever o valor esperado de forma legível?
- **Decisão sobre entradas inválidas:** duas opções razoáveis.
  - Lançar erro (`throw`): quem chamou com valor errado tem um bug, e é melhor descobrir cedo.
  - Retornar algo como `"R$ 0,00"`: a tela nunca quebra, mas o bug fica escondido.

  Qual combina mais com "dinheiro é sempre inteiro em centavos"? Pense também: de onde viria um preço negativo ou fracionado neste sistema? Para testar um `throw`, veja `expect(...).toThrow()` na doc do Vitest.
- **Negativo:** existe algum lugar no domínio (veja o `CONTEXT.md`) onde um valor negativo faria sentido, como desconto ou estorno? Isso ajuda a decidir.
