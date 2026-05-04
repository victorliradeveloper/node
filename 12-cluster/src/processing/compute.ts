import { PartialStats } from './streams/stats-aggregator.writable';

// Roda diretamente no worker process — sem worker_threads.
// No cluster, cada worker é um processo separado, então CPU-bound aqui
// não bloqueia os outros workers (cada um tem seu próprio event loop).
export function computeStats(stats: PartialStats): Record<string, unknown> {
  const columns: Record<string, unknown> = {};

  for (const [col, values] of Object.entries(stats.columns)) {
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = sum / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance =
      values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;

    columns[col] = {
      sum: +sum.toFixed(2),
      mean: +mean.toFixed(2),
      median: +median.toFixed(2),
      stdDev: +Math.sqrt(variance).toFixed(2),
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }

  return { totalRows: stats.rows, columns };
}
