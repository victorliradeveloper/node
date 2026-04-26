import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Todo } from './todo.entity';
import { TodoService } from './todo.service';
import { TodoController } from './todo.controller';
import { RabbitMqModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [TypeOrmModule.forFeature([Todo]), RabbitMqModule],
  providers: [TodoService],
  controllers: [TodoController],
})
export class TodoModule {}
