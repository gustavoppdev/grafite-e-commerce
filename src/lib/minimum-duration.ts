// Devolve só depois de `minimumMs`, com sucesso ou erro: esconde do cronômetro o caminho
// que o servidor tomou. Só funciona se o piso ficar acima do caminho mais lento normal.
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
