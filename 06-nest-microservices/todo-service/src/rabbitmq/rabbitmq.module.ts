import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';

export const TODO_EXCHANGE = 'todo.exchange';
export const ROUTING_CREATED = 'todo.created';
export const ROUTING_UPDATED = 'todo.updated';
export const ROUTING_DELETED = 'todo.deleted';

@Module({
  imports: [
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      useFactory: () => ({
        exchanges: [
          { name: TODO_EXCHANGE, type: 'topic' },
        ],
        uri: `amqp://${process.env.RABBITMQ_USER || 'guest'}:${process.env.RABBITMQ_PASS || 'guest'}@${process.env.RABBITMQ_HOST || 'localhost'}:5672`,
        connectionInitOptions: { wait: true },
      }),
    }),
  ],
  exports: [RabbitMQModule],
})
export class RabbitMqModule {}
