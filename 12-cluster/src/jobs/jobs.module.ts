import { Module } from '@nestjs/common';
import { JobStoreService } from './job-store.service';
import { IpcBridgeService } from '../ipc/ipc-bridge.service';

@Module({
  providers: [IpcBridgeService, JobStoreService],
  exports: [IpcBridgeService, JobStoreService],
})
export class JobsModule {}
