import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import * as Busboy from 'busboy';
import { JobStoreService } from '../jobs/job-store.service';
import { ProcessingService } from '../processing/processing.service';

@Injectable()
export class UploadService {
  constructor(
    private readonly jobStore: JobStoreService,
    private readonly processingService: ProcessingService,
  ) {}

  // Resolve assim que o file stream começa — não espera o processamento terminar
  startJob(req: Request): Promise<string> {
    return new Promise((resolve, reject) => {
      const job = this.jobStore.create();

      // busboy parseia multipart sem bufferizar o arquivo inteiro na memória
      const busboy = Busboy({ headers: req.headers });

      busboy.on('file', (_field, fileStream) => {
        resolve(job.id); // responde ao cliente imediatamente com o jobId

        // Processamento roda em background — cliente não precisa esperar
        this.processingService.process(job.id, fileStream).catch(console.error);
      });

      busboy.on('error', reject);
      req.pipe(busboy);
    });
  }
}
