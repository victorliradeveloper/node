import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { WorkerToMaster, MasterToWorker, JobStateMsg } from './ipc-message.interface';

@Injectable()
export class IpcBridgeService implements OnModuleInit {
  // EventEmitter interno: desacopla o handler de process.on('message') dos listeners
  private readonly emitter = new EventEmitter();

  onModuleInit() {
    // Recebe broadcasts do master e os redistribui via EventEmitter local
    process.on('message', (msg: MasterToWorker) => {
      if (msg.type === 'job:sync') {
        // Evento global: usado pelo JobStoreService para manter cache local
        this.emitter.emit('job:sync', msg.state);
        // Evento por job: usado pelo ProgressController para filtrar por jobId
        this.emitter.emit(`job:sync:${msg.state.id}`, msg.state);
      } else if (msg.type === 'job:get:reply') {
        this.emitter.emit(`job:get:reply:${msg.correlationId}`, msg.state);
      }
    });
  }

  // Envia mensagem para o master process via IPC
  send(msg: WorkerToMaster): void {
    process.send?.(msg);
  }

  // Escuta broadcasts de qualquer job — usado pelo JobStoreService para manter cache
  onAnyJobSync(handler: (state: JobStateMsg) => void): () => void {
    this.emitter.on('job:sync', handler);
    return () => this.emitter.off('job:sync', handler);
  }

  // Escuta broadcasts de um job específico — usado pelo ProgressController para SSE
  onJobSync(jobId: string, handler: (state: JobStateMsg) => void): () => void {
    this.emitter.on(`job:sync:${jobId}`, handler);
    return () => this.emitter.off(`job:sync:${jobId}`, handler);
  }

  // Padrão request-reply sobre IPC: pergunta ao master o estado de um job
  // Necessário quando o worker não tem o job no cache local
  requestJobState(jobId: string): Promise<JobStateMsg | null> {
    return new Promise((resolve) => {
      const correlationId = randomUUID();
      this.emitter.once(`job:get:reply:${correlationId}`, resolve);
      this.send({ type: 'job:get', jobId, correlationId });
    });
  }
}
