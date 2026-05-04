import cluster from 'cluster';
import type { Worker } from 'cluster';
import * as os from 'os';
import { WorkerToMaster, MasterToWorker, JobStateMsg } from './ipc/ipc-message.interface';

// Job store centralizado no master — único ponto de verdade para estado dos jobs.
// Workers mantêm cache local, mas o master é a fonte autoritativa.
const jobs = new Map<string, JobStateMsg>();

function broadcast(msg: MasterToWorker): void {
  for (const id in cluster.workers) {
    cluster.workers[id]?.send(msg);
  }
}

function attachWorkerHandlers(worker: Worker): void {
  worker.on('message', (msg: WorkerToMaster) => {
    if (msg.type === 'job:create') {
      const state: JobStateMsg = {
        id: msg.jobId,
        status: 'pending',
        processed: 0,
        result: null,
        startedAt: msg.startedAt,
        workerId: msg.workerId,
      };
      jobs.set(msg.jobId, state);
      // Broadcast para todos os workers: cada um atualiza seu cache local
      broadcast({ type: 'job:sync', state });

    } else if (msg.type === 'job:update') {
      const existing = jobs.get(msg.jobId);
      if (existing) {
        Object.assign(existing, msg.patch);
        broadcast({ type: 'job:sync', state: { ...existing } });
      }

    } else if (msg.type === 'job:get') {
      // Request-reply: responde apenas ao worker que perguntou
      const state = jobs.get(msg.jobId) ?? null;
      worker.send({ type: 'job:get:reply', correlationId: msg.correlationId, state });
    }
  });
}

export function startMaster(): void {
  const numWorkers = os.cpus().length;
  console.log(`Master ${process.pid} iniciando ${numWorkers} workers (${numWorkers} cores)...`);

  for (let i = 0; i < numWorkers; i++) {
    attachWorkerHandlers(cluster.fork());
  }

  // Reinicia automaticamente workers que caem — resiliência do cluster
  cluster.on('exit', (worker, code) => {
    console.log(`Worker ${worker.process.pid} encerrou (código ${code}). Reiniciando...`);
    attachWorkerHandlers(cluster.fork());
  });
}
