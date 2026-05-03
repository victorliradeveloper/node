import { Injectable } from '@nestjs/common';
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';
import * as fs from 'fs';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  async save(req: Readable, filename: string): Promise<void> {
    const gzip = createGzip();
    const dest = fs.createWriteStream(`./uploads/${filename}.gz`);

    // cada chunk que passa pelo gzip é um Buffer
    // pipeline fecha todas as streams e propaga erros automaticamente
    await pipeline(req, gzip, dest);
  }
}
