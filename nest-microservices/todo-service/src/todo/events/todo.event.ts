export class TodoEvent {
  todoId: string;
  title: string;
  action: 'CREATED' | 'UPDATED' | 'DELETED';
  occurredAt: Date;

  static of(todoId: string, title: string, action: TodoEvent['action']): TodoEvent {
    return { todoId, title, action, occurredAt: new Date() };
  }
}
