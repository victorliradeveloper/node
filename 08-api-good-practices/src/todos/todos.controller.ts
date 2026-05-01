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
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { QueryTodoDto } from './dto/query-todo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  findAll(@Request() req: any, @Query() query: QueryTodoDto) {
    return this.todosService.findAll(req.user.id, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.todosService.findOne(id, req.user.id);
  }

  @Post()
  create(@Body() dto: CreateTodoDto, @Request() req: any) {
    return this.todosService.create(req.user.id, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTodoDto,
    @Request() req: any,
  ) {
    return this.todosService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.todosService.remove(id, req.user.id);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string, @Request() req: any) {
    return this.todosService.complete(id, req.user.id);
  }
}
