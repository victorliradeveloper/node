// Mensagens de Worker → Master
export type WorkerToMaster =
  | { type: 'job:create'; jobId: string; startedAt: number; workerId: number }
  | { type: 'job:update'; jobId: string; patch: Record<string, unknown> }
  | { type: 'job:get'; jobId: string; correlationId: string };

// Mensagens de Master → Worker
export type MasterToWorker =
  | { type: 'job:sync'; state: JobStateMsg }
  | { type: 'job:get:reply'; correlationId: string; state: JobStateMsg | null };

// Representação serializada do estado de um job (viaja via IPC, sem EventEmitter)
export interface JobStateMsg {
  id: string;
  status: string;
  processed: number;
  result: Record<string, unknown> | null;
  error?: string;
  startedAt: number;
  workerId: number;
}
