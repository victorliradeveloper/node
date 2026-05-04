import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { Job } from './job.interface';

@Injectable()
export class JobStoreService {
  private readonly jobs = new Map<string, Job>();

  create(): Job {
    const job: Job = {
      id: randomUUID(),
      status: 'pending',
      processed: 0,
      result: null,
      emitter: new EventEmitter(),
      startedAt: Date.now(),
    };
    this.jobs.set(job.id, job);
    return job;
  }

  get(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  update(id: string, patch: Partial<Omit<Job, 'id' | 'emitter'>>): void {
    const job = this.jobs.get(id);
    if (job) Object.assign(job, patch);
  }
}
