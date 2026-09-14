/*
  Dinheiro no sistema é sempre um número INTEIRO de centavos (R$ 12,90 = 1290).
  Com decimais em ponto flutuante, contas simples dão errado: 0.1 + 0.2 === 0.30000000000000004.
  Somar itens do carrinho, calcular frete e total com inteiros é exato; só convertemos
  para reais na hora de mostrar na tela.
*/

// Criado uma vez e reaproveitado: montar um Intl.NumberFormat a cada chamada é caro.
const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatPrice(cents: number): string {
  return brl.format(cents / 100);
}
