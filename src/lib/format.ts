// Dinheiro é sempre inteiro em centavos (R$ 12,90 = 1290): ponto flutuante erra contas
// simples. Só vira reais na tela.

// Criado uma vez e reaproveitado: montar um Intl.NumberFormat a cada chamada é caro.
const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatPrice(cents: number): string {
  // Falha alto: um preço inválido aqui é conta errada antes, e "R$ 0,00" esconderia o bug.
  // É a última defesa (banco e Zod vêm antes). `isInteger` já recusa NaN e Infinity.
  if (!Number.isInteger(cents) || cents < 0) {
    throw new Error("formatPrice expects a non-negative integer of cents");
  }

  return brl.format(cents / 100);
}
