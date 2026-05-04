import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { JobState } from './job.interface';
import { IpcBridgeService } from '../ipc/ipc-bridge.service';

@Injectable()
export class JobStoreService {
  // Cache local do worker — atualizado automaticamente via broadcasts do master
  private readonly cache = new Map<string, JobState>();

  constructor(private readonly ipcBridge: IpcBridgeService) {
    // Escuta todos os broadcasts do master e mantém o cache sempre atualizado.
    // Assim, GET /result e GET /progress funcionam em qualquer worker,
    // mesmo que o upload tenha sido processado em outro.
    this.ipcBridge.onAnyJobSync((state) => {
      this.cache.set(state.id, state as JobState);
    });
  }

  create(): JobState {
    const job: JobState = {
      id: randomUUID(),
      status: 'pending',
      processed: 0,
      result: null,
      startedAt: Date.now(),
      workerId: process.pid,
    };
    this.cache.set(job.id, job);
    // Informa o master para registrar o job e fazer broadcast para os outros workers
    this.ipcBridge.send({
      type: 'job:create',
      jobId: job.id,
      startedAt: job.startedAt,
      workerId: process.pid,
    });
    return job;
  }

  async get(id: string): Promise<JobState | undefined> {
    // Caminho rápido: cache local já tem o estado
    if (this.cache.has(id)) return this.cache.get(id);

    // Caminho lento: pede ao master (request-reply via IPC)
    // Ocorre quando um worker diferente do criador recebe a requisição
    const state = await this.ipcBridge.requestJobState(id);
    if (state) {
      this.cache.set(state.id, state as JobState);
      return state as JobState;
    }
    return undefined;
  }

  update(id: string, patch: Partial<Omit<JobState, 'id'>>): void {
    // Atualiza cache local imediatamente (sem esperar o broadcast do master)
    const cached = this.cache.get(id);
    if (cached) Object.assign(cached, patch);
    // Envia ao master: ele atualiza o store central e faz broadcast para todos
    this.ipcBridge.send({ type: 'job:update', jobId: id, patch });
  }
}
