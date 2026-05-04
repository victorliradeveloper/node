import { Worker } from 'worker_threads';
import { join } from 'path';
import { PartialStats } from '../streams/stats-aggregator.writable';

// Em dev (ts-node), __filename termina em .ts — registra ts-node no worker
// Em prod (dist/), __filename termina em .js — usa o arquivo compilado
export function runHeavyCompute(
  stats: PartialStats,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const isTs = __filename.endsWith('.ts');
    const ext = isTs ? '.ts' : '.js';
    const workerFile = join(__dirname, `heavy-compute.worker${ext}`);
    const execArgv = isTs ? ['--require', 'ts-node/register'] : [];

    const worker = new Worker(workerFile, { execArgv });
    worker.postMessage(stats);
    worker.once('message', resolve);
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker saiu com código ${code}`));
    });
  });
}
