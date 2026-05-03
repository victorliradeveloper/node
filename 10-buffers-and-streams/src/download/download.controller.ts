import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { DownloadService } from './download.service';

@Controller('download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Get(':filename')
  async download(@Param('filename') filename: string, @Res() res: Response) {
    await this.downloadService.pipe(filename, res);
  }
}
