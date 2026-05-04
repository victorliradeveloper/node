import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [JobsModule],
  controllers: [ProgressController],
})
export class ProgressModule {}
