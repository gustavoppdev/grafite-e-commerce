import { describe, expect, it } from "vitest";
import { formatPrice } from "./format";

// `describe` agrupa os testes de uma unidade; cada `it` descreve UM comportamento,
// escrito como frase: "formatPrice formats cents as Brazilian reais".
describe("formatPrice", () => {
  it("formats cents as Brazilian reais with thousands separator", () => {
    // Arrange: prepara a entrada
    const cents = 123456;

    // Act: executa o que está sendo testado
    const result = formatPrice(cents);

    // Assert: confere o resultado
    // ` ` é um espaço NÃO SEPARÁVEL: o Intl coloca esse caractere entre "R$" e o número
    // para a quebra de linha nunca separar os dois. Na tela parece um espaço comum, mas
    // "R$ 1.234,56" digitado com espaço normal NÃO é igual e o teste falharia.
    expect(result).toBe("R$ 1.234,56");
  });
});
