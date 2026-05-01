import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { EmailService } from '../email/email.service';
import { OrderEventDto } from './dto/order-event.dto';
import { UserEventDto } from './dto/user-event.dto';

const EXCHANGE = 'user.exchange';

const QUEUES = [
  { queue: 'email.registered.queue', key: 'user.registered' },
  { queue: 'email.login.queue', key: 'user.login' },
  { queue: 'email.order.queue', key: 'order.created' },
  { queue: 'email.password.queue', key: 'user.password' },
];

@Injectable()
export class EmailConsumer implements OnModuleInit {
  private readonly logger = new Logger(EmailConsumer.name);

  constructor(private readonly emailService: EmailService) {}

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
    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    channel.prefetch(1);

    const handlers: Record<string, (data: any) => Promise<void>> = {
      'email.registered.queue': this.handleUserRegistered.bind(this),
      'email.login.queue': this.handleUserLogin.bind(this),
      'email.order.queue': this.handleOrderCreated.bind(this),
      'email.password.queue': this.handlePasswordReset.bind(this),
    };

    for (const { queue, key } of QUEUES) {
      await channel.assertQueue(queue, { durable: true });
      await channel.bindQueue(queue, EXCHANGE, key);
      channel.consume(queue, async (msg) => {
        if (!msg) return;
        try {
          const data = JSON.parse(msg.content.toString());
          await handlers[queue](data);
          channel.ack(msg);
        } catch (err) {
          this.logger.error(`Error processing ${queue}: ${err.message}`);
          channel.nack(msg, false, false);
        }
      });
    }

    this.logger.log('RabbitMQ consumer connected — listening on 4 queues');
  }

  private async handleUserRegistered(event: UserEventDto) {
    await this.emailService.send({
      to: event.payload.email,
      subject: `Bem-vindo ao sistema, ${event.payload.name}!`,
      html: this.emailService.template('USER_REGISTERED', event.payload),
    });
  }

  private async handleUserLogin(event: UserEventDto) {
    await this.emailService.send({
      to: event.payload.email,
      subject: 'Novo acesso detectado na sua conta',
      html: this.emailService.template('USER_LOGIN', event.payload),
    });
  }

  private async handleOrderCreated(event: OrderEventDto) {
    const shortId = event.payload.orderId.substring(0, 8);
    await this.emailService.send({
      to: event.payload.email,
      subject: `Pedido confirmado! #${shortId}`,
      html: this.emailService.template('ORDER_CREATED', event.payload),
    });
  }

  private async handlePasswordReset(event: UserEventDto) {
    await this.emailService.send({
      to: event.payload.email,
      subject: 'Redefinição de senha solicitada',
      html: this.emailService.template('USER_PASSWORD_RESET', event.payload),
    });
  }
}
