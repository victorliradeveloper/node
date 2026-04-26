import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Todo } from './todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoEvent } from './events/todo.event';
import {
  TODO_EXCHANGE,
  ROUTING_CREATED,
  ROUTING_UPDATED,
  ROUTING_DELETED,
} from '../rabbitmq/rabbitmq.module';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private readonly repository: Repository<Todo>,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async create(dto: CreateTodoDto): Promise<Todo> {
    const todo = this.repository.create({ ...dto, completed: false });
    const saved = await this.repository.save(todo);
    await this.publish(ROUTING_CREATED, TodoEvent.of(saved.id, saved.title, 'CREATED'));
    return saved;
  }

  findAll(): Promise<Todo[]> {
    return this.repository.find();
  }

  async findById(id: string): Promise<Todo> {
    const todo = await this.repository.findOneBy({ id });
    if (!todo) throw new NotFoundException(`Todo not found: ${id}`);
    return todo;
  }

  async update(id: string, dto: UpdateTodoDto): Promise<Todo> {
    const todo = await this.findById(id);
    Object.assign(todo, dto);
    const saved = await this.repository.save(todo);
    await this.publish(ROUTING_UPDATED, TodoEvent.of(saved.id, saved.title, 'UPDATED'));
    return saved;
  }

  async delete(id: string): Promise<void> {
    const todo = await this.findById(id);
    await this.repository.remove(todo);
    await this.publish(ROUTING_DELETED, TodoEvent.of(id, todo.title, 'DELETED'));
  }

  private async publish(routingKey: string, event: TodoEvent): Promise<void> {
    await this.amqpConnection.publish(TODO_EXCHANGE, routingKey, event);
  }
}
