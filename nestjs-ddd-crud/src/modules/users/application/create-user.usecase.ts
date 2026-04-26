import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { UserRepository } from '../domain/user.repository';
import { User } from '../domain/user.entity';
import { Email } from '../domain/email.vo';
import { CreateUserDto } from './dtos/create-user.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(createUserDto: CreateUserDto): Promise<User> {
    const email = new Email(createUserDto.email);
    
    const existingUser = await this.userRepository.findByEmail(email.getValue());

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    const user = new User(
      createUserDto.name,
      email,
      createUserDto.age,
    );

    return await this.userRepository.create(user);
  }
}

