import { Module } from '@nestjs/common';
import { JobsModule } from './jobs/jobs.module';
import { ProcessingModule } from './processing/processing.module';
import { UploadModule } from './upload/upload.module';
import { ProgressModule } from './progress/progress.module';
import { ResultModule } from './result/result.module';

@Module({
  imports: [JobsModule, ProcessingModule, UploadModule, ProgressModule, ResultModule],
})
export class AppModule {}
