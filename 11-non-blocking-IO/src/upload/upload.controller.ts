import { Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  async upload(@Req() req: Request, @Res() res: Response) {
    const jobId = await this.uploadService.startJob(req);
    res.json({ jobId });
  }
}
