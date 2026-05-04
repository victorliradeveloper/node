import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { JobStoreService } from '../jobs/job-store.service';

@Controller('progress')
export class ProgressController {
  constructor(private readonly jobStore: JobStoreService) {}

  @Get(':id')
  stream(@Param('id') id: string, @Res() res: Response): void {
    const job = this.jobStore.get(id);
    if (!job) throw new NotFoundException();

    // SSE: mantém a conexão HTTP aberta para push de eventos do servidor
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (event: string, data: unknown) =>
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    const onProgress = (data: unknown) => send('progress', data);
    const onDone = (result: unknown) => {
      send('done', result);
      res.end();
    };
    const onError = (err: unknown) => {
      send('error', err);
      res.end();
    };

    // EventEmitter: escuta eventos emitidos pelo ProcessingService
    job.emitter.on('progress', onProgress);
    job.emitter.once('done', onDone);
    job.emitter.once('error', onError);

    // Remove listeners quando o cliente desconectar (evita memory leak)
    res.on('close', () => {
      job.emitter.off('progress', onProgress);
      job.emitter.off('done', onDone);
      job.emitter.off('error', onError);
    });

    // Job já terminou antes do cliente conectar ao SSE
    if (job.status === 'done') {
      send('done', job.result);
      res.end();
    } else if (job.status === 'error') {
      send('error', { message: job.error });
      res.end();
    }
  }
}
