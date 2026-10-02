import { describe, expect, it } from "vitest";
import { formatPrice } from "./format";

// O Intl usa espaço não separável (U+00A0) entre "R$" e o número. Escrito como escape para
// ficar visível; normalizar a comparação aceitaria o espaço comum, que é o erro a pegar.
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

  // Um risco por caso: zero à esquerda, separador de milhar nos milhões, centavos zerados.
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

  // `expect` recebe uma função, para o `toThrow` capturar. O trecho da mensagem evita passar
  // com qualquer erro, inclusive um engano do próprio teste.
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
