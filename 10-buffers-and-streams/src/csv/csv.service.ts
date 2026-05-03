import { Injectable } from '@nestjs/common';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { Response } from 'express';
import { CsvToJsonTransform } from './csv-transform.stream';

@Injectable()
export class CsvService {
  async process(req: Readable, res: Response): Promise<void> {
    const transform = new CsvToJsonTransform();

    // ndjson: um JSON por linha — permite streaming da resposta
    res.setHeader('Content-Type', 'application/x-ndjson');

    await pipeline(req, transform, res);
  }
}
