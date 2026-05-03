import { Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { CsvService } from './csv.service';

@Controller('csv')
export class CsvController {
  constructor(private readonly csvService: CsvService) {}

  @Post()
  async process(@Req() req: Request, @Res() res: Response) {
    await this.csvService.process(req, res);
  }
}
