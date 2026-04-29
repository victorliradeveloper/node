import {
  Controller, // Decorator que define uma classe como um controlador REST
  Get, // Decorator para definir um endpoint HTTP GET
  Post, // Decorator para definir um endpoint HTTP POST
  Body, // Decorator para extrair dados do corpo da requisição
  Patch, // Decorator para definir um endpoint HTTP PATCH
  Param, // Decorator para extrair parâmetros da URL
  Delete, // Decorator para definir um endpoint HTTP DELETE
  HttpCode, // Decorator para definir o código de status HTTP da resposta
  HttpStatus, // Enum com códigos de status HTTP
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

// @Controller('users') - Define que esta classe é um controlador REST
// O parâmetro 'users' define o prefixo da rota base para todos os endpoints desta classe
// Exemplo: todas as rotas serão acessíveis em /users/...
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // @Post() - Define um endpoint HTTP POST para criar um novo usuário
  // @HttpCode(HttpStatus.CREATED) - Define que a resposta terá status 201 (Created)
  // @Body() - Extrai os dados do corpo da requisição e os converte para CreateUserDto
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // @Get() - Define um endpoint HTTP GET para buscar todos os usuários
  // Acessível em: GET /users
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // @Get(':id') - Define um endpoint HTTP GET para buscar um usuário específico
  // @Param('id') - Extrai o parâmetro 'id' da URL
  // Acessível em: GET /users/123 (onde 123 é o ID do usuário)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  // @Patch(':id') - Define um endpoint HTTP PATCH para atualizar parcialmente um usuário
  // @Param('id') - Extrai o ID do usuário da URL
  // @Body() - Extrai os dados de atualização do corpo da requisição
  // Acessível em: PATCH /users/123
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  // @Delete(':id') - Define um endpoint HTTP DELETE para remover um usuário
  // @HttpCode(HttpStatus.NO_CONTENT) - Define que a resposta terá status 204 (No Content)
  // @Param('id') - Extrai o ID do usuário da URL
  // Acessível em: DELETE /users/123
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
