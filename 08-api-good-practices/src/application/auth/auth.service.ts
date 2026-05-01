import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AUTH_USE_CASE } from '../../domain/port/in/auth.use-case';
import type { AuthUseCase, AuthOutput } from '../../domain/port/in/auth.use-case';
import { USER_REPOSITORY_PORT } from '../../domain/port/out/user-repository.port';
import type { UserRepositoryPort } from '../../domain/port/out/user-repository.port';
import { InvalidCredentialsException } from '../../domain/exception/invalid-credentials.exception';
import { UserAlreadyExistsException } from '../../domain/exception/user-already-exists.exception';

@Injectable()
export class AuthService implements AuthUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT) private readonly userRepo: UserRepositoryPort,
    private readonly jwtService: JwtService,
  ) {}

  async register(name: string, email: string, password: string): Promise<AuthOutput> {
    const exists = await this.userRepo.findByEmail(email);
    if (exists) throw new UserAlreadyExistsException();

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.userRepo.create(name, email, hashed);

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return { token, user: { id: user.id, name: user.name, email: user.email } };
  }

  async login(email: string, password: string): Promise<AuthOutput> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new InvalidCredentialsException();

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new InvalidCredentialsException();

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return { token, user: { id: user.id, name: user.name, email: user.email } };
  }
}
