import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TodoListener {
  private readonly logger = new Logger(TodoListener.name);

  @RabbitSubscribe({
    exchange: 'todo.exchange',
    routingKey: 'todo.created',
    queue: 'todo.created.queue',
  })
  onTodoCreated(event: any) {
    this.logger.log(`[NOTIFICATION] Todo CRIADO -> id=${event.todoId} | title='${event.title}' | em=${event.occurredAt}`);
  }

  @RabbitSubscribe({
    exchange: 'todo.exchange',
    routingKey: 'todo.updated',
    queue: 'todo.updated.queue',
  })
  onTodoUpdated(event: any) {
    this.logger.log(`[NOTIFICATION] Todo ATUALIZADO -> id=${event.todoId} | title='${event.title}' | em=${event.occurredAt}`);
  }

  @RabbitSubscribe({
    exchange: 'todo.exchange',
    routingKey: 'todo.deleted',
    queue: 'todo.deleted.queue',
  })
  onTodoDeleted(event: any) {
    this.logger.log(`[NOTIFICATION] Todo DELETADO -> id=${event.todoId} | title='${event.title}' | em=${event.occurredAt}`);
  }
}
