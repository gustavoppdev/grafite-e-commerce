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
  /*
    Preço negativo ou fracionado não é dado válido neste sistema: se um chegou aqui,
    alguém fez conta errada antes — passou reais onde o sistema espera centavos, ou
    subtraiu desconto sem limitar no zero. Devolver "R$ 0,00" esconderia isso: a tela
    mostraria um preço plausível e errado, e o bug só apareceria semanas depois. Falhar
    alto faz o bug aparecer no dia em que foi escrito.

    Este `throw` é a ÚLTIMA linha de defesa, não a primeira: quem garante que preço não
    é negativo é a constraint da coluna no banco e o Zod na entrada do admin (Feature 3).
    Se este erro disparar em produção, duas camadas antes já falharam.

    `Number.isInteger` já responde `false` para NaN e Infinity, então cobre os três casos
    inválidos junto com a comparação `< 0`.
  */
  if (!Number.isInteger(cents) || cents < 0) {
    throw new Error("formatPrice expects a non-negative integer of cents");
  }

  return brl.format(cents / 100);
}
