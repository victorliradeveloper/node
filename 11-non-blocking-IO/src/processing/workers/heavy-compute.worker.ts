import { parentPort } from 'worker_threads';
import { PartialStats } from '../streams/stats-aggregator.writable';

// Roda em thread separada — CPU-bound aqui não bloqueia o event loop principal
parentPort?.on('message', (stats: PartialStats) => {
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

  parentPort?.postMessage({ totalRows: stats.rows, columns });
});
