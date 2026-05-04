import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { JobStoreService } from '../jobs/job-store.service';
import { IpcBridgeService } from '../ipc/ipc-bridge.service';

@Controller('progress')
export class ProgressController {
  constructor(
    private readonly jobStore: JobStoreService,
    private readonly ipcBridge: IpcBridgeService,
  ) {}

  @Get(':id')
  async stream(@Param('id') id: string, @Res() res: Response): Promise<void> {
    // get() pode fazer request-reply ao master se o job não estiver no cache local
    const job = await this.jobStore.get(id);
    if (!job) throw new NotFoundException();

    // SSE: mantém a conexão HTTP aberta para push de eventos do servidor
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (event: string, data: unknown) =>
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    // Job já terminou antes do cliente conectar ao SSE
    if (job.status === 'done') { send('done', job.result); res.end(); return; }
    if (job.status === 'error') { send('error', { message: job.error }); res.end(); return; }

    // Escuta broadcasts do master via IpcBridgeService.
    // Funciona mesmo que este worker não seja o que está processando o job —
    // o master faz broadcast para todos os workers a cada update.
    const unsubscribe = this.ipcBridge.onJobSync(id, (state) => {
      if (state.status === 'processing' || state.status === 'pending') {
        send('progress', { processed: state.processed });
      } else if (state.status === 'done') {
        send('done', state.result);
        res.end();
      } else if (state.status === 'error') {
        send('error', { message: state.error });
        res.end();
      }
    });

    // Remove listener quando o cliente desconectar (evita memory leak)
    res.on('close', unsubscribe);
  }
}
