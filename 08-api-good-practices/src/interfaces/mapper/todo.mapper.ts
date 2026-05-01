import { Todo } from '../../domain/model/todo.model';
import { TodoResponseDto } from '../dto/response/todo-response.dto';
import { CreateTodoRequestDto } from '../dto/request/create-todo-request.dto';
import { UpdateTodoRequestDto } from '../dto/request/update-todo-request.dto';

export class TodoMapper {
  static toResponse(todo: Todo): TodoResponseDto {
    return {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.completed,
      userId: todo.userId,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    };
  }

  static toCreateInput(dto: CreateTodoRequestDto) {
    return { title: dto.title, description: dto.description };
  }

  static toUpdateInput(dto: UpdateTodoRequestDto) {
    return { title: dto.title, description: dto.description, completed: dto.completed };
  }
}
