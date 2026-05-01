import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { QueryTodoDto } from './dto/query-todo.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: QueryTodoDto) {
    const {
      title,
      completed,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      cursor,
      sortBy = 'createdAt',
      order = 'desc',
    } = query;

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

    const orderBy: Prisma.TodoOrderByWithRelationInput = {
      [sortBy]: order,
    };

    if (cursor) {
      const items = await this.prisma.todo.findMany({
        where,
        orderBy,
        take: limit,
        skip: 1,
        cursor: { id: cursor },
      });

      const nextCursor =
        items.length === limit ? items[items.length - 1].id : null;

      return { items, nextCursor, pagination: { type: 'cursor', cursor, limit } };
    }

    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.todo.findMany({ where, orderBy, take: limit, skip }),
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

  async findOne(id: string, userId: string) {
    const todo = await this.prisma.todo.findUnique({ where: { id } });
    if (!todo) throw new NotFoundException('Todo not found');
    if (todo.userId !== userId) throw new ForbiddenException();
    return todo;
  }

  async create(userId: string, dto: CreateTodoDto) {
    return this.prisma.todo.create({
      data: { ...dto, userId },
    });
  }

  async update(id: string, userId: string, dto: UpdateTodoDto) {
    await this.findOne(id, userId);
    return this.prisma.todo.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.todo.delete({ where: { id } });
  }

  async complete(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.todo.update({
      where: { id },
      data: { completed: true },
    });
  }
}
