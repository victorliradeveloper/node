import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { JobStoreService } from '../jobs/job-store.service';
import { CsvParseTransform } from './streams/csv-parse.transform';
import { StatsAggregatorWritable } from './streams/stats-aggregator.writable';
import { computeStats } from './compute';

@Injectable()
export class ProcessingService {
  constructor(private readonly jobStore: JobStoreService) {}

  async process(jobId: string, fileStream: Readable): Promise<void> {
    this.jobStore.update(jobId, { status: 'processing' });

    const csvTransform = new CsvParseTransform();
    const aggregator = new StatsAggregatorWritable((rows) => {
      // IPC tem overhead maior que EventEmitter local, então throttle a cada 1000 rows.
      // O master ainda recebe atualizações regulares sem ser inundado de mensagens.
      if (rows % 1000 === 0) {
        this.jobStore.update(jobId, { processed: rows });
      }
    });

    try {
      await pipeline(fileStream, csvTransform, aggregator);

      // Calcula estatísticas diretamente neste worker process.
      // Como cluster isola processos, o CPU-bound aqui não bloqueia outros workers.
      const partialStats = aggregator.getPartialStats();
      const result = computeStats(partialStats);

      this.jobStore.update(jobId, { status: 'done', result, processed: partialStats.rows });
    } catch (err) {
      this.jobStore.update(jobId, { status: 'error', error: String(err) });
    }
  }
}
