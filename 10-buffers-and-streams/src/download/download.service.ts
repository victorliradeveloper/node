import { Injectable, NotFoundException } from '@nestjs/common';
import { pipeline } from 'stream/promises';
import { createGunzip } from 'zlib';
import * as fs from 'fs';
import { Response } from 'express';

@Injectable()
export class DownloadService {
  async pipe(filename: string, res: Response): Promise<void> {
    const path = `./uploads/${filename}.gz`;

    if (!fs.existsSync(path)) {
      throw new NotFoundException(`${filename} não encontrado`);
    }

    const file = fs.createReadStream(path);
    const gunzip = createGunzip();

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // descomprime on-the-fly: bytes comprimidos → gunzip → bytes originais → cliente
    await pipeline(file, gunzip, res);
  }
}
