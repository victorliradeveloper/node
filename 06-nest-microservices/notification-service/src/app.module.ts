import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { TodoListener } from './todo/todo.listener';

@Module({
  imports: [
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      useFactory: () => ({
        exchanges: [
          { name: 'todo.exchange', type: 'topic' },
        ],
        uri: `amqp://${process.env.RABBITMQ_USER || 'guest'}:${process.env.RABBITMQ_PASS || 'guest'}@${process.env.RABBITMQ_HOST || 'localhost'}:5672`,
        connectionInitOptions: { wait: true },
      }),
    }),
  ],
  providers: [TodoListener],
})
export class AppModule {}
