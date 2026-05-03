import { Module } from '@nestjs/common';
import { UploadModule } from './upload/upload.module';
import { DownloadModule } from './download/download.module';
import { CsvModule } from './csv/csv.module';

@Module({
  imports: [UploadModule, DownloadModule, CsvModule],
})
export class AppModule {}
