import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateUserUseCase } from '../application/create-user.usecase';
import { GetAllUsersUseCase } from '../application/get-all-users.usecase';
import { GetUserUseCase } from '../application/get-user.usecase';
import { UpdateUserUseCase } from '../application/update-user.usecase';
import { DeleteUserUseCase } from '../application/delete-user.usecase';
import { CreateUserDto } from '../application/dtos/create-user.dto';
import { UpdateUserDto } from '../application/dtos/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.createUserUseCase.execute(createUserDto);
    return this.toResponse(user);
  }

  @Get()
  async findAll() {
    const users = await this.getAllUsersUseCase.execute();
    return users.map((user) => this.toResponse(user));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.getUserUseCase.execute(+id);
    return this.toResponse(user);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.updateUserUseCase.execute(+id, updateUserDto);
    return this.toResponse(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.deleteUserUseCase.execute(+id);
  }

  private toResponse(user: any) {
    return {
      id: user.getId(),
      name: user.getName(),
      email: user.getEmail().getValue(),
      age: user.getAge(),
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt(),
    };
  }
}

