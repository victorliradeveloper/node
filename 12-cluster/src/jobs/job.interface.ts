export type JobStatus = 'pending' | 'processing' | 'done' | 'error';

// Sem EventEmitter: comunicação entre processos acontece via IPC (process.send)
// e o master faz broadcast do estado atualizado para todos os workers
export interface JobState {
  id: string;
  status: JobStatus;
  processed: number;
  result: Record<string, unknown> | null;
  error?: string;
  startedAt: number;
  workerId: number;
}
