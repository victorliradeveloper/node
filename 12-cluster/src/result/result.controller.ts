import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { JobStoreService } from '../jobs/job-store.service';

@Controller('result')
export class ResultController {
  constructor(private readonly jobStore: JobStoreService) {}

  @Get(':id')
  async get(@Param('id') id: string) {
    // get() é async: pode precisar do request-reply IPC se job não estiver no cache
    const job = await this.jobStore.get(id);
    if (!job) throw new NotFoundException();

    return {
      id: job.id,
      status: job.status,
      processed: job.processed,
      result: job.result,
      error: job.error ?? null,
      elapsedMs: Date.now() - job.startedAt,
      workerId: job.workerId, // qual worker process processou este job
    };
  }
}
