import { describe, expect, it } from "vitest";
import { formatPrice } from "./format";

/*
  Espaço NÃO SEPARÁVEL (U+00A0): é o caractere que o Intl coloca entre "R$" e o número,
  para a quebra de linha nunca separar os dois. Na tela parece um espaço comum, mas
  "R$ 1.234,56" digitado com espaço normal NÃO é igual e o teste falharia.

  Escrito como escape (`\u{a0}`) de propósito: colado como caractere literal ele some no
  meio do código e ninguém entende por que o teste quebrou. Note que a solução é deixar o
  valor ESPERADO legível, e não afrouxar a comparação — normalizar a string antes do
  `toBe`, ou usar `toContain`/regex com `\s`, faria o teste aceitar o espaço comum, que é
  exatamente o erro que ele existe para pegar.
*/
const nbsp = "\u{a0}";

// Trecho distintivo da mensagem de erro. `toThrow` com string confere se a mensagem
// CONTÉM o trecho, então não precisamos congelar a frase inteira em três testes.
const invalidAmount = "non-negative integer";

// `describe` agrupa os testes de uma unidade; cada `it` descreve UM comportamento,
// escrito como frase: "formatPrice formats cents as Brazilian reais".
describe("formatPrice", () => {
  it("formats cents as Brazilian reais with thousands separator", () => {
    // Arrange: prepara a entrada
    const cents = 123456;

    // Act: executa o que está sendo testado
    const result = formatPrice(cents);

    // Assert: confere o resultado
    expect(result).toBe(`R$${nbsp}1.234,56`);
  });

  /*
    Cada caso abaixo trava um risco DIFERENTE, não uma variação do mesmo teste:
    o zero à esquerda em valores abaixo de um real, o segundo separador de milhar nos
    milhões, e os centavos zerados — que precisam continuar aparecendo, senão a vitrine
    mostraria "R$ 100" ao lado de "R$ 99,90" e a coluna de preços ficaria torta.
  */
  it("formats zero", () => {
    const result = formatPrice(0);

    expect(result).toBe(`R$${nbsp}0,00`);
  });

  it("formats an amount under one real", () => {
    const result = formatPrice(5);

    expect(result).toBe(`R$${nbsp}0,05`);
  });

  it("formats an amount in the millions", () => {
    const result = formatPrice(100000000);

    expect(result).toBe(`R$${nbsp}1.000.000,00`);
  });

  it("formats a round amount with no cents", () => {
    const result = formatPrice(1000);

    expect(result).toBe(`R$${nbsp}10,00`);
  });

  /*
    Entradas inválidas. O `expect` recebe uma FUNÇÃO, não o resultado da chamada: quem
    precisa executar `formatPrice` é o próprio `toThrow`, para capturar o erro. Passando
    `formatPrice(-1000)` direto, a chamada estouraria antes de o `expect` existir.

    O trecho passado para `toThrow` importa: `toThrow()` sem argumento passa com QUALQUER
    erro, inclusive um TypeError vindo de um engano no próprio teste.
  */
  it("throws for a negative amount", () => {
    expect(() => formatPrice(-1000)).toThrow(invalidAmount);
  });

  it("throws for a non-integer amount", () => {
    expect(() => formatPrice(0.5)).toThrow(invalidAmount);
  });

  it("throws for NaN", () => {
    expect(() => formatPrice(NaN)).toThrow(invalidAmount);
  });
});
