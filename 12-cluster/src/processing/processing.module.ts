import { Module } from '@nestjs/common';
import { ProcessingService } from './processing.service';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [JobsModule],
  providers: [ProcessingService],
  exports: [ProcessingService],
})
export class ProcessingModule {}
