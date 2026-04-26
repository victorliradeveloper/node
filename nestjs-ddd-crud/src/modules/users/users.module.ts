import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './interface/users.controller';
import { UserRepository } from './domain/user.repository';
import { UserRepositoryTypeOrm } from './infrastructure/user.repository.typeorm';
import { UserTypeOrm } from './infrastructure/user.entity.typeorm';
import { CreateUserUseCase } from './application/create-user.usecase';
import { GetAllUsersUseCase } from './application/get-all-users.usecase';
import { GetUserUseCase } from './application/get-user.usecase';
import { UpdateUserUseCase } from './application/update-user.usecase';
import { DeleteUserUseCase } from './application/delete-user.usecase';

@Module({
  imports: [TypeOrmModule.forFeature([UserTypeOrm])],
  controllers: [UsersController],
  providers: [
    UserRepositoryTypeOrm,
    {
      provide: UserRepository,
      useClass: UserRepositoryTypeOrm,
    },
    CreateUserUseCase,
    GetAllUsersUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
  ],
  exports: [UserRepository],
})
export class UsersModule {}

