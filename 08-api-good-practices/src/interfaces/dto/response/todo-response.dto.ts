export class TodoResponseDto {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
