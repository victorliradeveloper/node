import { EventEmitter } from 'events';

export type JobStatus = 'pending' | 'processing' | 'done' | 'error';

export interface Job {
  id: string;
  status: JobStatus;
  processed: number;
  result: Record<string, unknown> | null;
  error?: string;
  emitter: EventEmitter;
  startedAt: number;
}
