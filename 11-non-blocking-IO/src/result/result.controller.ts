import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { JobStoreService } from '../jobs/job-store.service';

@Controller('result')
export class ResultController {
  constructor(private readonly jobStore: JobStoreService) {}

  @Get(':id')
  get(@Param('id') id: string) {
    const job = this.jobStore.get(id);
    if (!job) throw new NotFoundException();

    return {
      id: job.id,
      status: job.status,
      processed: job.processed,
      result: job.result,
      error: job.error ?? null,
      elapsedMs: Date.now() - job.startedAt,
    };
  }
}
