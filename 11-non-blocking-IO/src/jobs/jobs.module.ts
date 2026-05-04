import { Module } from '@nestjs/common';
import { JobStoreService } from './job-store.service';

@Module({
  providers: [JobStoreService],
  exports: [JobStoreService],
})
export class JobsModule {}
