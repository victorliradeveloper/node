import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { OrderEventDto } from './dto/order-event.dto';
import { UserEventDto } from './dto/user-event.dto';

const EXCHANGE = 'user.exchange';

const QUEUES = [
  { queue: 'email.registered.queue', key: 'user.registered' },
  { queue: 'email.login.queue', key: 'user.login' },
  { queue: 'email.order.queue', key: 'order.created' },
  { queue: 'email.password.queue', key: 'user.password' },
];

const ROUTING_KEYS: Record<string, string> = {
  USER_REGISTERED: 'user.registered',
  USER_LOGIN: 'user.login',
  USER_PASSWORD_RESET: 'user.password',
  ORDER_CREATED: 'order.created',
};

@Injectable()
export class EventPublisherService implements OnModuleInit {
  private readonly logger = new Logger(EventPublisherService.name);
  private channel: amqp.Channel | amqp.ConfirmChannel;

  private async connect(): Promise<amqp.ChannelModel> {
    const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
    for (let attempt = 1; attempt <= 10; attempt++) {
      try {
        return await amqp.connect(url);
      } catch {
        this.logger.warn(`RabbitMQ not ready, retry ${attempt}/10...`);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
    throw new Error('Could not connect to RabbitMQ after 10 attempts');
  }

  async onModuleInit() {
    const connection = await this.connect();
    this.channel = await connection.createChannel();

    await this.channel.assertExchange(EXCHANGE, 'topic', { durable: true });

    for (const { queue, key } of QUEUES) {
      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.bindQueue(queue, EXCHANGE, key);
    }

    this.logger.log('RabbitMQ publisher connected');
  }

  publishUserEvent(event: UserEventDto): void {
    const routingKey = ROUTING_KEYS[event.eventType];
    this.channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(event)), {
      persistent: true,
    });
    this.logger.log(`Published ${event.eventType} → ${routingKey}`);
  }

  publishOrderEvent(event: OrderEventDto): void {
    this.channel.publish(EXCHANGE, 'order.created', Buffer.from(JSON.stringify(event)), {
      persistent: true,
    });
    this.logger.log(`Published ORDER_CREATED → order.created`);
  }
}
