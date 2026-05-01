import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TodoController } from '../../interfaces/rest/todo.controller';
import { TodoService } from './todo.service';
import { TodoRepositoryAdapter } from '../../infrastructure/persistence/adapter/todo-repository.adapter';
import { TODO_USE_CASE } from '../../domain/port/in/todo.use-case';
import { TODO_REPOSITORY_PORT } from '../../domain/port/out/todo-repository.port';

@Module({
  imports: [AuthModule],
  controllers: [TodoController],
  providers: [
    { provide: TODO_REPOSITORY_PORT, useClass: TodoRepositoryAdapter },
    { provide: TODO_USE_CASE, useClass: TodoService },
  ],
})
export class TodoModule {}
