import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { JobsModule } from '../jobs/jobs.module';
import { ProcessingModule } from '../processing/processing.module';

@Module({
  imports: [JobsModule, ProcessingModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
