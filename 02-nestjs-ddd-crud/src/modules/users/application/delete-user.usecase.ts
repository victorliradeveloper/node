import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { UserRepository } from '../domain/user.repository';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.userRepository.delete(id);
  }
}

