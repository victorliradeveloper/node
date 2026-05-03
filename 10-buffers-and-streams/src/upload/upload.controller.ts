import { BadRequestException, Controller, HttpCode, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @HttpCode(200)
  async upload(@Req() req: Request, @Query('filename') filename: string) {
    if (!filename) throw new BadRequestException('query param filename é obrigatório');

    await this.uploadService.save(req, filename);

    return { message: 'salvo', file: `${filename}.gz` };
  }
}
