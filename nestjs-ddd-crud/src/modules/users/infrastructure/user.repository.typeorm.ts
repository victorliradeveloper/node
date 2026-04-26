import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from '../domain/user.repository';
import { User } from '../domain/user.entity';
import { Email } from '../domain/email.vo';
import { UserTypeOrm } from './user.entity.typeorm';

@Injectable()
export class UserRepositoryTypeOrm implements UserRepository {
  constructor(
    @InjectRepository(UserTypeOrm)
    private readonly repository: Repository<UserTypeOrm>,
  ) {}

  async create(user: User): Promise<User> {
    const userTypeOrm = this.toTypeOrm(user);
    const saved = await this.repository.save(userTypeOrm);
    return this.toDomain(saved);
  }

  async findAll(): Promise<User[]> {
    const users = await this.repository.find({
      order: { createdAt: 'DESC' },
    });
    return users.map((user) => this.toDomain(user));
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.repository.findOne({
      where: { id },
    });
    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.repository.findOne({
      where: { email },
    });
    return user ? this.toDomain(user) : null;
  }

  async update(user: User): Promise<User> {
    const userTypeOrm = this.toTypeOrm(user);
    const updated = await this.repository.save(userTypeOrm);
    return this.toDomain(updated);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  private toDomain(userTypeOrm: UserTypeOrm): User {
    return new User(
      userTypeOrm.name,
      new Email(userTypeOrm.email),
      userTypeOrm.age,
      userTypeOrm.id,
      userTypeOrm.createdAt,
      userTypeOrm.updatedAt,
    );
  }

  private toTypeOrm(user: User): UserTypeOrm {
    const userTypeOrm = new UserTypeOrm();
    if (user.getId()) {
      userTypeOrm.id = user.getId();
    }
    userTypeOrm.name = user.getName();
    userTypeOrm.email = user.getEmail().getValue();
    userTypeOrm.age = user.getAge();
    userTypeOrm.createdAt = user.getCreatedAt();
    userTypeOrm.updatedAt = user.getUpdatedAt();
    return userTypeOrm;
  }
}

