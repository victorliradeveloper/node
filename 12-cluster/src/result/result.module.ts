import { Module } from '@nestjs/common';
import { ResultController } from './result.controller';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [JobsModule],
  controllers: [ResultController],
})
export class ResultModule {}
