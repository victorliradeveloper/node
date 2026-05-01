import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { OrderEventPayload } from '../messaging/dto/order-event.dto';
import { UserEventPayload } from '../messaging/dto/user-event.dto';
import { EmailTemplateFactory } from './templates/email-template.factory';

type TemplateType = 'USER_REGISTERED' | 'USER_LOGIN' | 'ORDER_CREATED' | 'USER_PASSWORD_RESET';

interface SendOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.MAILTRAP_PORT) || 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });
  }

  template(type: TemplateType, payload: UserEventPayload | OrderEventPayload): string {
    return EmailTemplateFactory.build(type, payload);
  }

  async send(options: SendOptions): Promise<void> {
    await this.transporter.sendMail({
      from: '"User Service" <noreply@userservice.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    this.logger.log(`Email sent to ${options.to} — ${options.subject}`);
  }
}
