import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { UserRepository } from '../domain/user.repository';
import { User } from '../domain/user.entity';
import { Email } from '../domain/email.vo';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (updateUserDto.email && updateUserDto.email !== user.getEmail().getValue()) {
      const email = new Email(updateUserDto.email);
      const existingUser = await this.userRepository.findByEmail(email.getValue());

      if (existingUser && existingUser.getId() !== id) {
        throw new ConflictException('Email já está em uso');
      }

      user.updateEmail(email);
    }

    if (updateUserDto.name !== undefined) {
      user.updateName(updateUserDto.name);
    }

    if (updateUserDto.age !== undefined) {
      user.updateAge(updateUserDto.age);
    }

    return await this.userRepository.update(user);
  }
}

