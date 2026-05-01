import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { EventPublisherService } from '../messaging/event-publisher.service';
import { UsersService } from '../users/users.service';
import { CustomJwtService } from '../jwt/jwt.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: CustomJwtService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({ name: dto.name, email: dto.email, password });

    const token = this.jwtService.sign({ userId: user.id, name: user.name }, user.email);

    this.eventPublisher.publishUserEvent({
      eventType: 'USER_REGISTERED',
      timestamp: new Date().toISOString(),
      payload: { userId: user.id, name: user.name, email: user.email },
    });

    return { name: user.name, token };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({ userId: user.id, name: user.name }, user.email);

    this.eventPublisher.publishUserEvent({
      eventType: 'USER_LOGIN',
      timestamp: new Date().toISOString(),
      payload: { userId: user.id, name: user.name, email: user.email },
    });

    return { name: user.name, token };
  }
}
