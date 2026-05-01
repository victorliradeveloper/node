import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { TODO_USE_CASE } from '../../domain/port/in/todo.use-case';
import type { TodoUseCase, TodoFilter } from '../../domain/port/in/todo.use-case';
import { TODO_REPOSITORY_PORT } from '../../domain/port/out/todo-repository.port';
import type { TodoRepositoryPort } from '../../domain/port/out/todo-repository.port';
import { TodoNotFoundException } from '../../domain/exception/todo-not-found.exception';
import type { Todo } from '../../domain/model/todo.model';

@Injectable()
export class TodoService implements TodoUseCase {
  constructor(
    @Inject(TODO_REPOSITORY_PORT) private readonly todoRepo: TodoRepositoryPort,
  ) {}

  async findAll(userId: string, filter: TodoFilter) {
    const { sortBy = 'createdAt', order = 'desc', page = 1, limit = 20, cursor, ...rest } = filter;
    const orderBy = { field: sortBy, direction: order };
    const pagination = cursor
      ? { type: 'cursor' as const, cursor, limit }
      : { type: 'offset' as const, page, limit };
    return this.todoRepo.findAll(userId, rest, orderBy, pagination);
  }

  async findOne(id: string, userId: string): Promise<Todo> {
    const todo = await this.todoRepo.findById(id);
    if (!todo) throw new TodoNotFoundException();
    if (todo.userId !== userId) throw new ForbiddenException();
    return todo;
  }

  async create(userId: string, title: string, description?: string): Promise<Todo> {
    return this.todoRepo.create(userId, title, description);
  }

  async update(id: string, userId: string, data: { title?: string; description?: string; completed?: boolean }): Promise<Todo> {
    await this.findOne(id, userId);
    return this.todoRepo.update(id, data);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.todoRepo.delete(id);
  }

  async complete(id: string, userId: string): Promise<Todo> {
    await this.findOne(id, userId);
    return this.todoRepo.update(id, { completed: true });
  }
}
