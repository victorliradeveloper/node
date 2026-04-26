import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

// @Injectable() - Decorator que marca esta classe como um serviço que pode ser injetado
// Permite que o NestJS gerencie a instância desta classe automaticamente
@Injectable()
export class UsersService {
  constructor(
    // @InjectRepository(User) - Injeta o Repository<User> do TypeORM
    // O NestJS automaticamente cria e injeta uma instância do Repository para a entidade User
    @InjectRepository(User)
    private usersRepository: Repository<User>, // Repository para operações de banco de dados com User
  ) {}

  // Método para criar um novo usuário
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar se o email já existe no banco de dados
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email }, // Busca por email específico
    });

    // Se encontrar um usuário com o mesmo email, lança exceção
    if (existingUser) {
      throw new ConflictException('Email já está em uso'); // HTTP 409 - Conflict
    }

    // Cria uma nova instância da entidade User com os dados do DTO
    const user = this.usersRepository.create(createUserDto);
    // Salva o usuário no banco de dados e retorna a entidade salva
    return await this.usersRepository.save(user);
  }

  // Método para buscar todos os usuários
  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      order: { createdAt: 'DESC' }, // Ordena por data de criação (mais recentes primeiro)
    });
  }

  // Método para buscar um usuário específico por ID
  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id }, // Busca pelo ID específico
    });

    // Se não encontrar o usuário, lança exceção
    if (!user) {
      throw new NotFoundException('Usuário não encontrado'); // HTTP 404 - Not Found
    }

    return user;
  }

  // Método para atualizar um usuário existente
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    // Primeiro busca o usuário para garantir que existe
    const user = await this.findOne(id);

    // Se estiver atualizando o email, verificar se o novo email já existe
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });

      // Se encontrar outro usuário com o mesmo email, lança exceção
      if (existingUser) {
        throw new ConflictException('Email já está em uso');
      }
    }

    // Object.assign() - Copia as propriedades do DTO para a entidade existente
    // Atualiza apenas os campos fornecidos no DTO
    Object.assign(user, updateUserDto);
    // Salva as alterações no banco de dados
    return await this.usersRepository.save(user);
  }

  // Método para remover um usuário
  async remove(id: number): Promise<void> {
    // Primeiro busca o usuário para garantir que existe
    const user = await this.findOne(id);
    // Remove o usuário do banco de dados
    await this.usersRepository.remove(user);
  }
}
