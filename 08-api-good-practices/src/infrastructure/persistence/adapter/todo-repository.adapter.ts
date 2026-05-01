import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TodoRepositoryPort } from '../../../domain/port/out/todo-repository.port';
import { Todo } from '../../../domain/model/todo.model';

@Injectable()
export class TodoRepositoryAdapter implements TodoRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, filter: any, orderBy: any, pagination: any): Promise<any> {
    const { title, completed, startDate, endDate } = filter;

    const where: Prisma.TodoWhereInput = {
      userId,
      ...(title && { title: { contains: title, mode: 'insensitive' } }),
      ...(completed !== undefined && { completed }),
      ...((startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
    };

    const prismaOrderBy: Prisma.TodoOrderByWithRelationInput = {
      [orderBy.field]: orderBy.direction,
    };

    if (pagination.type === 'cursor') {
      const { cursor, limit } = pagination;
      const items = await this.prisma.todo.findMany({
        where,
        orderBy: prismaOrderBy,
        take: limit,
        skip: 1,
        cursor: { id: cursor },
      });
      const nextCursor = items.length === limit ? items[items.length - 1].id : null;
      return { items, nextCursor, pagination: { type: 'cursor', cursor, limit } };
    }

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.todo.findMany({ where, orderBy: prismaOrderBy, take: limit, skip }),
      this.prisma.todo.count({ where }),
    ]);

    return {
      items,
      pagination: {
        type: 'offset',
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  findById(id: string): Promise<Todo | null> {
    return this.prisma.todo.findUnique({ where: { id } });
  }

  create(userId: string, title: string, description?: string): Promise<Todo> {
    return this.prisma.todo.create({ data: { userId, title, description } });
  }

  update(id: string, data: { title?: string; description?: string; completed?: boolean }): Promise<Todo> {
    return this.prisma.todo.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.todo.delete({ where: { id } });
  }
}
