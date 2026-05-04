import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { JobStoreService } from '../jobs/job-store.service';
import { CsvParseTransform } from './streams/csv-parse.transform';
import { StatsAggregatorWritable } from './streams/stats-aggregator.writable';
import { runHeavyCompute } from './workers/run-in-worker';

@Injectable()
export class ProcessingService {
  constructor(private readonly jobStore: JobStoreService) {}

  // Fire-and-forget: não bloqueia o caller — processamento corre em background
  async process(jobId: string, fileStream: Readable): Promise<void> {
    const job = this.jobStore.get(jobId);
    if (!job) return;

    this.jobStore.update(jobId, { status: 'processing' });

    const csvTransform = new CsvParseTransform();
    const aggregator = new StatsAggregatorWritable((rows) => {
      // EventEmitter: emite progresso após cada row processado
      this.jobStore.update(jobId, { processed: rows });
      job.emitter.emit('progress', { processed: rows });
    });

    try {
      // pipeline() gerencia backpressure automaticamente e fecha todas as
      // streams em caso de erro — substitui o encadeamento manual com .pipe()
      await pipeline(fileStream, csvTransform, aggregator);

      // Após o stream terminar, delega o trabalho CPU-bound ao worker_thread
      // O event loop principal permanece livre durante esse cálculo
      const partialStats = aggregator.getPartialStats();
      const result = await runHeavyCompute(partialStats);

      this.jobStore.update(jobId, { status: 'done', result });
      job.emitter.emit('done', result);
    } catch (err) {
      this.jobStore.update(jobId, { status: 'error', error: String(err) });
      job.emitter.emit('error', { message: String(err) });
    }
  }
}
