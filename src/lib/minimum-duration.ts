/*
  Roda `work` e só devolve depois de pelo menos `minimumMs` milissegundos, tenha `work`
  dado certo ou lançado erro.

  Serve para esconder do cronômetro o caminho que o servidor tomou. Exemplo do login: quando
  o e-mail não existe, o servidor faz uma consulta a menos no banco e responde mais rápido.
  Com a resposta sempre saindo no mesmo piso, os dois caminhos ficam iguais também no tempo,
  não só no conteúdo.

  O piso tem que ser MAIOR que o caminho mais lento em condições normais: se `work`
  ultrapassar o piso, aquela resposta sai com o tempo real, e a diferença volta a aparecer
  nesses casos.
*/
export async function withMinimumDuration<T>(
  work: () => Promise<T>,
  minimumMs: number,
): Promise<T> {
  const startedAt = performance.now();
  try {
    return await work();
  } finally {
    const remaining = minimumMs - (performance.now() - startedAt);
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
  }
}
