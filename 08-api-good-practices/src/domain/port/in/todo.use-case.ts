import { Todo } from '../../model/todo.model';

export const TODO_USE_CASE = 'TODO_USE_CASE';

export interface TodoFilter {
  title?: string;
  completed?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  cursor?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface TodoUseCase {
  findAll(userId: string, filter: TodoFilter): Promise<any>;
  findOne(id: string, userId: string): Promise<Todo>;
  create(userId: string, title: string, description?: string): Promise<Todo>;
  update(id: string, userId: string, data: { title?: string; description?: string; completed?: boolean }): Promise<Todo>;
  remove(id: string, userId: string): Promise<void>;
  complete(id: string, userId: string): Promise<Todo>;
}
