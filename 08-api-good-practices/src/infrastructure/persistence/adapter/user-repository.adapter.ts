import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRepositoryPort } from '../../../domain/port/out/user-repository.port';
import { User } from '../../../domain/model/user.model';

@Injectable()
export class UserRepositoryAdapter implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(name: string, email: string, password: string): Promise<User> {
    return this.prisma.user.create({ data: { name, email, password } });
  }
}
