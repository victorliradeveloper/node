import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { EmailConsumer } from './email.consumer';

@Module({
  imports: [EmailModule],
  providers: [EmailConsumer],
})
export class MessagingModule {}
