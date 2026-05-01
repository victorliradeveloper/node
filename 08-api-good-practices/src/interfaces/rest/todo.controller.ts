import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { TODO_USE_CASE } from '../../domain/port/in/todo.use-case';
import type { TodoUseCase } from '../../domain/port/in/todo.use-case';
import { JwtAuthGuard } from '../../infrastructure/security/jwt-auth.guard';
import { CreateTodoRequestDto } from '../dto/request/create-todo-request.dto';
import { UpdateTodoRequestDto } from '../dto/request/update-todo-request.dto';
import { TodoFilterDto } from '../dto/request/todo-filter.dto';
import { TodoMapper } from '../mapper/todo.mapper';

@UseGuards(JwtAuthGuard)
@Controller('todos')
export class TodoController {
  constructor(@Inject(TODO_USE_CASE) private readonly todoUseCase: TodoUseCase) {}

  @Get()
  findAll(@Request() req: any, @Query() filter: TodoFilterDto) {
    return this.todoUseCase.findAll(req.user.id, filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.todoUseCase.findOne(id, req.user.id);
  }

  @Post()
  create(@Body() dto: CreateTodoRequestDto, @Request() req: any) {
    const { title, description } = TodoMapper.toCreateInput(dto);
    return this.todoUseCase.create(req.user.id, title, description);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTodoRequestDto,
    @Request() req: any,
  ) {
    return this.todoUseCase.update(id, req.user.id, TodoMapper.toUpdateInput(dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.todoUseCase.remove(id, req.user.id);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string, @Request() req: any) {
    return this.todoUseCase.complete(id, req.user.id);
  }
}
